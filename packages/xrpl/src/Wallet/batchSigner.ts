import { bytesToHex } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'
import { decodeAccountID } from 'ripple-address-codec'
import { decode, encode, encodeForSigningBatch } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Batch, Transaction, validate } from '../models'
import { BatchSigner, validateBatch } from '../models/transactions/batch'
import { hashSignedTx } from '../utils/hashes'

import { Wallet } from '.'

/**
 * Sign a multi-account Batch transaction.
 *
 * @param wallet - Wallet instance.
 * @param transaction - The Batch transaction to sign.
 * @param opts - Additional options for regular key and multi-signing complexity.
 * @param opts.batchAccount - The account submitting the inner Batch transaction, on behalf of which is this signature.
 * @param opts.multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
 *                       The actual address is only needed in the case of regular key usage.
 * @throws ValidationError if the transaction is malformed.
 */
// eslint-disable-next-line max-lines-per-function -- TODO: refactor
export function signMultiBatch(
  wallet: Wallet,
  transaction: Batch,
  opts: { batchAccount?: string; multisign?: boolean | string } = {},
): void {
  const batchAccount = opts.batchAccount ?? wallet.classicAddress
  let multisignAddress: boolean | string = false
  if (typeof opts.multisign === 'string') {
    multisignAddress = opts.multisign
  } else if (opts.multisign) {
    multisignAddress = wallet.classicAddress
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed for JS
  if (transaction.TransactionType !== 'Batch') {
    throw new ValidationError('Must be a Batch transaction.')
  }

  const involvedAccounts = transaction.RawTransactions.map(
    (raw) => raw.RawTransaction.Account,
  )
  if (!involvedAccounts.includes(batchAccount)) {
    throw new ValidationError(
      'Must be signing for an address included in the Batch.',
    )
  }
  /*
   * This will throw a more clear error for JS users if the supplied transaction has incorrect formatting
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
  validate(transaction as unknown as Record<string, unknown>)
  const fieldsToSign = {
    flags: transaction.Flags,
    txIDs: transaction.RawTransactions.map((rawTx) =>
      hashSignedTx(rawTx.RawTransaction),
    ),
  }
  let batchSigner: BatchSigner
  if (multisignAddress) {
    batchSigner = {
      BatchSigner: {
        Account: batchAccount,
        Signers: [
          {
            Signer: {
              Account: multisignAddress,
              SigningPubKey: wallet.publicKey,
              TxnSignature: sign(
                encodeForSigningBatch(fieldsToSign),
                wallet.privateKey,
              ),
            },
          },
        ],
      },
    }
  } else {
    batchSigner = {
      BatchSigner: {
        Account: batchAccount,
        SigningPubKey: wallet.publicKey,
        TxnSignature: sign(
          encodeForSigningBatch(fieldsToSign),
          wallet.privateKey,
        ),
      },
    }
  }

  // eslint-disable-next-line no-param-reassign -- okay for signing
  transaction.BatchSigners = [batchSigner]
}

/**
 * Takes several transactions with BatchSigners fields (in object or blob form) and creates a
 * single transaction with all BatchSigners that then gets signed and returned.
 *
 * @param transactions The transactions to combine `BatchSigners` values on.
 * @returns A single signed Transaction which has all BatchSigners from transactions within it.
 * @throws ValidationError if:
 * - There were no transactions given to sign
 * @category Signing
 */
export function combineBatchSigners(
  transactions: Array<Batch | string>,
): string {
  if (transactions.length === 0) {
    throw new ValidationError('There are 0 transactions to combine.')
  }

  const decodedTransactions: Transaction[] = transactions.map((txOrBlob) => {
    return getDecodedTransaction(txOrBlob)
  })

  decodedTransactions.forEach((tx) => {
    if (tx.TransactionType !== 'Batch') {
      throw new ValidationError('TransactionType must be `Batch`.')
    }
    /*
     * This will throw a more clear error for JS users if any of the supplied transactions has incorrect formatting
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
    validateBatch(tx as unknown as Record<string, unknown>)
    if (tx.BatchSigners == null || tx.BatchSigners.length === 0) {
      throw new ValidationError(
        'For combining Batch transaction signatures, all transactions must include a BatchSigners field containing an array of signatures.',
      )
    }

    if (tx.TxnSignature != null || tx.Signers != null) {
      throw new ValidationError('Batch transaction must be unsigned.')
    }
  })

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
  const batchTransactions = decodedTransactions as Batch[]

  validateBatchTransactionEquivalence(batchTransactions)

  return encode(getTransactionWithAllBatchSigners(batchTransactions))
}

/**
 * The transactions should all be equal except for the 'Signers' field.
 *
 * @param transactions - An array of Transactions which are expected to be equal other than 'Signers'.
 * @throws ValidationError if the transactions are not equal in any field other than 'Signers'.
 */
function validateBatchTransactionEquivalence(transactions: Batch[]): void {
  const exampleTransaction = JSON.stringify({
    flags: transactions[0].Flags,
    transactionIDs: transactions[0].RawTransactions.map((rawTx) =>
      hashSignedTx(rawTx.RawTransaction),
    ),
  })
  if (
    transactions.slice(1).some(
      (tx) =>
        JSON.stringify({
          flags: tx.Flags,
          transactionIDs: tx.RawTransactions.map((rawTx) =>
            hashSignedTx(rawTx.RawTransaction),
          ),
        }) !== exampleTransaction,
    )
  ) {
    throw new ValidationError(
      'Flags and transaction hashes are not the same for all provided transactions.',
    )
  }
}

function getTransactionWithAllBatchSigners(transactions: Batch[]): Batch {
  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: BatchSigner[] = transactions
    .flatMap((tx) => tx.BatchSigners ?? [])
    .filter((signer) => signer.BatchSigner.Account !== transactions[0].Account)
    .sort(compareBatchSigners)

  return { ...transactions[0], BatchSigners: sortedSigners }
}

/**
 * If presented in binary form, the BatchSigners array must be sorted based on
 * the numeric value of the signer addresses, with the lowest value first.
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html.
 *
 * @param left - A BatchSigner to compare with.
 * @param right - A second BatchSigner to compare with.
 * @returns 1 if left \> right, 0 if left = right, -1 if left \< right, and null if left or right are NaN.
 */
function compareBatchSigners(left: BatchSigner, right: BatchSigner): number {
  return addressToBigNumber(left.BatchSigner.Account).comparedTo(
    addressToBigNumber(right.BatchSigner.Account),
  )
}

// copied from signer.ts
// TODO: refactor
const NUM_BITS_IN_HEX = 16

function addressToBigNumber(address: string): BigNumber {
  const hex = bytesToHex(decodeAccountID(address))
  return new BigNumber(hex, NUM_BITS_IN_HEX)
}

function getDecodedTransaction(txOrBlob: Transaction | string): Transaction {
  if (typeof txOrBlob === 'object') {
    // We need this to handle X-addresses in multisigning
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
    return decode(encode(txOrBlob)) as unknown as Transaction
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
  return decode(txOrBlob) as unknown as Transaction
}
