import { encode, encodeForSigningBatch } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Batch, Transaction, validate } from '../models'
import { BatchSigner, validateBatch } from '../models/transactions/batch'
import { hashSignedTx } from '../utils/hashes'

import { compareSigners, getDecodedTransaction } from './utils'

import { Wallet } from '.'

// eslint-disable-next-line max-params -- okay for helper function
function constructBatchSignerObject(
  batchAccount: string,
  wallet: Wallet,
  signature: string,
  multisignAddress: string | false = false,
): BatchSigner {
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
              TxnSignature: signature,
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
        TxnSignature: signature,
      },
    }
  }
  return batchSigner
}

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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- for JS purposes
  if (transaction.TransactionType !== 'Batch') {
    throw new ValidationError('Must be a Batch transaction.')
  }
  /*
   * This will throw a more clear error for JS users if the supplied transaction has incorrect formatting
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
  validate(transaction as unknown as Record<string, unknown>)

  const involvedAccounts = new Set(
    transaction.RawTransactions.map((raw) => raw.RawTransaction.Account),
  )
  if (!involvedAccounts.has(batchAccount)) {
    throw new ValidationError(
      'Must be signing for an address submitting a transaction in the Batch.',
    )
  }
  const fieldsToSign = {
    flags: transaction.Flags,
    txIDs: transaction.RawTransactions.map((rawTx) =>
      hashSignedTx(rawTx.RawTransaction),
    ),
  }
  const signature = sign(encodeForSigningBatch(fieldsToSign), wallet.privateKey)

  // eslint-disable-next-line no-param-reassign -- okay for signing
  transaction.BatchSigners = [
    constructBatchSignerObject(
      batchAccount,
      wallet,
      signature,
      multisignAddress,
    ),
  ]
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
    .sort((signer1, signer2) =>
      compareSigners(signer1.BatchSigner, signer2.BatchSigner),
    )

  return { ...transactions[0], BatchSigners: sortedSigners }
}
