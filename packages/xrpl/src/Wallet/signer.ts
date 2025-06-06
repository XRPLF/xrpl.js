import { encode, encodeForSigning } from 'ripple-binary-codec'
import { verify } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Signer } from '../models/common'
import { Transaction, validate } from '../models/transactions'

import { compareSigners, getDecodedTransaction } from './utils'

/**
 * Takes several transactions with Signer fields (in object or blob form) and creates a
 * single transaction with all Signers that then gets signed and returned.
 *
 * @param transactions - An array of signed Transactions (in object or blob form) to combine into a single signed Transaction.
 * @returns A single signed Transaction which has all Signers from transactions within it.
 * @throws ValidationError if:
 * - There were no transactions given to sign
 * - The SigningPubKey field is not the empty string in any given transaction
 * - Any transaction is missing a Signers field.
 * @category Signing
 */
function multisign(transactions: Array<Transaction | string>): string {
  if (transactions.length === 0) {
    throw new ValidationError('There were 0 transactions to multisign')
  }

  const decodedTransactions: Transaction[] = transactions.map(
    (txOrBlob: string | Transaction) => {
      return getDecodedTransaction(txOrBlob)
    },
  )

  decodedTransactions.forEach((tx) => {
    /*
     * This will throw a more clear error for JS users if any of the supplied transactions has incorrect formatting
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
    validate(tx as unknown as Record<string, unknown>)
    if (tx.Signers == null || tx.Signers.length === 0) {
      throw new ValidationError(
        "For multisigning all transactions must include a Signers field containing an array of signatures. You may have forgotten to pass the 'forMultisign' parameter when signing.",
      )
    }

    if (tx.SigningPubKey !== '') {
      throw new ValidationError(
        'SigningPubKey must be an empty string for all transactions when multisigning.',
      )
    }
  })

  validateTransactionEquivalence(decodedTransactions)

  return encode(getTransactionWithAllSigners(decodedTransactions))
}

/**
 * Verifies that the given transaction has a valid signature based on public-key encryption.
 *
 * @param tx - A transaction to verify the signature of. (Can be in object or encoded string format).
 * @param [publicKey] Specific public key to use to verify. If not specified the `SigningPublicKey` of tx will be used.
 * @returns Returns true if tx has a valid signature, and returns false otherwise.
 * @throws Error when transaction is missing TxnSignature
 * @throws Error when publicKey is not provided and transaction is missing SigningPubKey
 * @category Utilities
 */
function verifySignature(
  tx: Transaction | string,
  publicKey?: string,
): boolean {
  const decodedTx: Transaction = getDecodedTransaction(tx)
  let key = publicKey

  // Need a SignedTransaction class where TxnSignature is not optional.
  if (typeof decodedTx.TxnSignature !== 'string' || !decodedTx.TxnSignature) {
    throw new Error('Transaction is missing a signature, TxnSignature')
  }

  if (!key) {
    // Need a SignedTransaction class where TxnSignature is not optional.
    if (
      typeof decodedTx.SigningPubKey !== 'string' ||
      !decodedTx.SigningPubKey
    ) {
      throw new Error('Transaction is missing a public key, SigningPubKey')
    }
    key = decodedTx.SigningPubKey
  }

  return verify(encodeForSigning(decodedTx), decodedTx.TxnSignature, key)
}

/**
 * The transactions should all be equal except for the 'Signers' field.
 *
 * @param transactions - An array of Transactions which are expected to be equal other than 'Signers'.
 * @throws ValidationError if the transactions are not equal in any field other than 'Signers'.
 */
function validateTransactionEquivalence(transactions: Transaction[]): void {
  const exampleTransaction = JSON.stringify({
    ...transactions[0],
    Signers: null,
  })
  if (
    transactions
      .slice(1)
      .some(
        (tx) => JSON.stringify({ ...tx, Signers: null }) !== exampleTransaction,
      )
  ) {
    throw new ValidationError(
      'txJSON is not the same for all signedTransactions',
    )
  }
}

function getTransactionWithAllSigners(
  transactions: Transaction[],
): Transaction {
  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: Signer[] = transactions
    .flatMap((tx) => tx.Signers ?? [])
    .sort((signer1, signer2) => compareSigners(signer1.Signer, signer2.Signer))

  return { ...transactions[0], Signers: sortedSigners }
}

export { verifySignature, multisign }
