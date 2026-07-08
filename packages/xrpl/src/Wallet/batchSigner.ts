import { encode, encodeForSigningBatch } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Batch, Transaction, validate } from '../models'
import { BatchSigner, validateBatch } from '../models/transactions/batch'
import { hashSignedTx } from '../utils/hashes'

import { compareSigners, getDecodedTransaction } from './utils'

import type { Wallet } from './index'

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
 * Resolve the sequence value bound into a Batch signature: the `Sequence` when
 * non-zero, otherwise the `TicketSequence` value (or 0).
 *
 * @param transaction - The Batch transaction being signed.
 * @returns The sequence value to bind into the signature.
 */
function getBatchSeqValue(transaction: Batch): number {
  const sequence = transaction.Sequence ?? 0
  if (sequence !== 0) {
    return sequence
  }
  return transaction.TicketSequence ?? 0
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
// eslint-disable-next-line max-lines-per-function -- cohesive signing routine
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

  // An account must sign the Batch if it authorizes an inner transaction or is
  // the `Counterparty` of one.
  const involvedAccounts = new Set<string>()
  transaction.RawTransactions.forEach((raw) => {
    // A delegated inner transaction is authorized by the delegate, not the
    // account holder, so the delegate is the required signer when present.
    involvedAccounts.add(
      raw.RawTransaction.Delegate ?? raw.RawTransaction.Account,
    )
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Counterparty only exists on some inner tx types
    const counterparty = (raw.RawTransaction as Record<string, unknown>)
      .Counterparty
    if (typeof counterparty === 'string') {
      involvedAccounts.add(counterparty)
    }
  })
  if (!involvedAccounts.has(batchAccount)) {
    throw new ValidationError(
      'Must be signing for an address submitting a transaction in the Batch.',
    )
  }
  const fieldsToSign = {
    account: transaction.Account,
    sequence: getBatchSeqValue(transaction),
    flags: transaction.Flags,
    txIDs: transaction.RawTransactions.map((rawTx) =>
      hashSignedTx(rawTx.RawTransaction),
    ),
    batchAccount,
    // Multi-signed batch signers also bind the inner signer account.
    ...(multisignAddress ? { signerAccount: multisignAddress } : {}),
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
 * Builds a comparison key over every field bound into a Batch signature
 * (XLS-56 V1_1): the outer account, sequence value, flags, and inner
 * transaction IDs. Fragments that disagree on any of these were signed over
 * different payloads and cannot be combined.
 *
 * @param tx - The Batch transaction to derive the key from.
 * @returns A stable string key for equivalence comparison.
 */
function getBatchEquivalenceKey(tx: Batch): string {
  return JSON.stringify({
    account: tx.Account,
    sequence: getBatchSeqValue(tx),
    flags: tx.Flags,
    transactionIDs: tx.RawTransactions.map((rawTx) =>
      hashSignedTx(rawTx.RawTransaction),
    ),
  })
}

/**
 * The transactions should all be equal except for the 'Signers' field.
 *
 * @param transactions - An array of Transactions which are expected to be equal other than 'Signers'.
 * @throws ValidationError if the transactions are not equal in any field other than 'Signers'.
 */
function validateBatchTransactionEquivalence(transactions: Batch[]): void {
  const exampleTransaction = getBatchEquivalenceKey(transactions[0])
  if (
    transactions
      .slice(1)
      .some((tx) => getBatchEquivalenceKey(tx) !== exampleTransaction)
  ) {
    throw new ValidationError(
      'Account, sequence, flags, and transaction hashes must be the same for all provided transactions.',
    )
  }
}

function getTransactionWithAllBatchSigners(transactions: Batch[]): Batch {
  const outerAccount = transactions[0].Account

  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: BatchSigner[] = transactions
    .flatMap((tx) => tx.BatchSigners ?? [])
    // A batch signer cannot be the outer account (rippled: temBAD_SIGNER).
    .filter((signer) => signer.BatchSigner.Account !== outerAccount)
    .sort((signer1, signer2) =>
      compareSigners(signer1.BatchSigner, signer2.BatchSigner),
    )

  // BatchSigners must be strictly ascending and unique by account, so
  // de-duplicate when combining fragments that share a signer.
  const dedupedSigners: BatchSigner[] = []
  let lastAccount = ''
  for (const signer of sortedSigners) {
    const account = signer.BatchSigner.Account
    if (account !== lastAccount) {
      dedupedSigners.push(signer)
      lastAccount = account
    }
  }

  return { ...transactions[0], BatchSigners: dedupedSigners }
}
