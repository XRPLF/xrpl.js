/* eslint-disable @typescript-eslint/consistent-type-assertions --
Casting to JSON is needed for interacting with ripple-binary-codec */
import { BigNumber } from 'bignumber.js'
import { isEqual, flatMap } from 'lodash'
import { decodeAccountID } from 'ripple-address-codec'
import {
  encode,
  decode,
  encodeForSigning,
  encodeForMultisigning,
  encodeForSigningClaim,
} from 'ripple-binary-codec'
import { sign as signWithKeypair, verify } from 'ripple-keypairs'

import { ValidationError } from '../common/errors'
import { Signer } from '../models/common'
import { Transaction } from '../models/transactions'
import { verifyBaseTransaction } from '../models/transactions/common'
import { objectDiff } from '../utils'

/**
 * Uses a wallet to cryptographically sign a transaction which proves the owner of the wallet
 * is issuing this transaction.
 *
 * @param publicKey - The public key to sign this transaction with.
 * @param privateKey - The private key to sign this transaction with.
 * @param tx - The Transaction that is being signed.
 * @param options - Multisign only. SignAs is the account that is adding it's signature to the Signers field.
 * @throws ValidationError when tx is already signed, meaning it has the TxnSignature or Signers properties.
 * @returns A signed Transaction.
 */
// eslint-disable-next-line max-params -- It's simpler to ask for publicKey and privateKey separately
function sign(
  publicKey: string,
  privateKey: string,
  tx: Transaction,
  options = { signAs: '' },
): string {
  if (tx.TxnSignature || tx.Signers) {
    throw new ValidationError(
      'tx must not contain "TxnSignature" or "Signers" properties',
    )
  }

  const txToSignAndEncode: Transaction = { ...tx }

  txToSignAndEncode.SigningPubKey = options.signAs ? '' : publicKey

  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: publicKey,
      TxnSignature: computeSignature(
        txToSignAndEncode as unknown as JSON,
        privateKey,
        options.signAs,
      ),
    }
    txToSignAndEncode.Signers = [{ Signer: signer }]
  } else {
    txToSignAndEncode.TxnSignature = computeSignature(
      txToSignAndEncode as unknown as JSON,
      privateKey,
    )
  }
  const serialized = encode(txToSignAndEncode)
  checkTxSerialization(serialized, tx)
  return serialized
}

/**
 * Takes several transactions (in object or blob form) and creates a single transaction with all Signers
 * that then gets signed and returned.
 *
 * @param transactions - An array of Transactions (in object or blob form) to combine and sign.
 * @returns A single signed Transaction which has all Signers from transactions within it.
 * @throws ValidationError if:
 * - There were no transactions given to sign
 * - The SigningPubKey field is not the empty string in any given transaction
 * - Any transaction is missing a Signers field.
 */
function multisign(transactions: Array<Transaction | string>): Transaction {
  if (transactions.length === 0) {
    throw new ValidationError('There were 0 transactions to multisign')
  }

  transactions.forEach((txOrBlob) => {
    const tx: Transaction = getDecodedTransaction(txOrBlob)

    // This will throw a more clear error for JS users if any of the supplied transactions has incorrect formatting
    // TODO: Replace this with verify() (The general validation function for all Transactions)
    // , also make verify accept '| Transaction' to avoid type casting here.
    verifyBaseTransaction(tx as unknown as Record<string, unknown>)
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

  const decodedTransactions: Transaction[] = transactions.map(
    (txOrBlob: string | Transaction) => {
      return getDecodedTransaction(txOrBlob)
    },
  )

  validateTransactionEquivalence(decodedTransactions)

  return getTransactionWithAllSigners(decodedTransactions)
}

/**
 * Creates a signature that can be used to redeem a specific amount of XRP from a payment channel.
 *
 * @param privateKey - The private key used to sign for this Payment Channel authorization.
 * @param channelId - An id for the payment channel to redeem XRP from.
 * @param amount - The amount in drops to redeem.
 * @returns A signature that can be used to redeem a specific amount of XRP from a payment channel.
 */
function authorizeChannel(
  privateKey: string,
  channelId: string,
  amount: string,
): string {
  const signingData = encodeForSigningClaim({
    channel: channelId,
    amount,
  })

  return signWithKeypair(signingData, privateKey)
}

/**
 * Verifies that the given transaction has a valid signature based on public-key encryption.
 *
 * @param tx - A transaction to verify the signature of. (Can be in object or encoded string format).
 * @returns Returns true if tx has a valid signature, and returns false otherwise.
 */
function verifySignature(tx: Transaction | string): boolean {
  const decodedTx: Transaction = getDecodedTransaction(tx)
  return verify(
    encodeForSigning(decodedTx),
    decodedTx.TxnSignature,
    decodedTx.SigningPubKey,
  )
}

function computeSignature(
  tx: JSON,
  privateKey: string,
  signAs?: string,
): string {
  const signingData = signAs
    ? encodeForMultisigning(tx, signAs)
    : encodeForSigning(tx)
  return signWithKeypair(signingData, privateKey)
}

/**
 *  Decode a serialized transaction, remove the fields that are added during the signing process,
 *  and verify that it matches the transaction prior to signing.
 *
 * @param serialized - A signed and serialized transaction.
 * @param tx - The transaction prior to signing.
 * @throws ValidationError if the signed and serialized transaction does not match the original after signing.
 */
function checkTxSerialization(serialized: string, tx: Transaction): void {
  // Decode the serialized transaction:
  const decoded = decode(serialized)

  // ...And ensure it is equal to the original tx, except:
  // - It must have a TxnSignature or Signers (multisign).
  if (!decoded.TxnSignature && !decoded.Signers) {
    throw new ValidationError(
      'Serialized transaction must have a TxnSignature or Signers property',
    )
  }
  // - We know that the original tx did not have TxnSignature, so we should delete it:
  delete decoded.TxnSignature
  // - We know that the original tx did not have Signers, so if it exists, we should delete it:
  delete decoded.Signers

  // - If SigningPubKey was not in the original tx, then we should delete it.
  //   But if it was in the original tx, then we should ensure that it has not been changed.
  if (!tx.SigningPubKey) {
    delete decoded.SigningPubKey
  }

  // - Memos have exclusively hex data which should ignore case.
  //   Since decode goes to upper case, we set all tx memos to be uppercase for the comparison.
  tx.Memos?.map((memo) => {
    if (memo.Memo.MemoData) {
      memo.Memo.MemoData = memo.Memo.MemoData.toUpperCase()
    }

    if (memo.Memo.MemoType) {
      memo.Memo.MemoType = memo.Memo.MemoType.toUpperCase()
    }

    if (memo.Memo.MemoFormat) {
      memo.Memo.MemoFormat = memo.Memo.MemoFormat.toUpperCase()
    }

    return memo
  })

  if (!isEqual(decoded, tx)) {
    const data = {
      decoded,
      tx,
      diff: objectDiff(tx, decoded),
    }
    const error = new ValidationError(
      'Serialized transaction does not match original txJSON. See `error.data`',
      data,
    )
    throw error
  }
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
  const sortedSigners: Signer[] = flatMap(
    transactions,
    (tx) => tx.Signers ?? [],
  ).sort(compareSigners)

  return { ...transactions[0], Signers: sortedSigners }
}

/**
 * If presented in binary form, the Signers array must be sorted based on
 * the numeric value of the signer addresses, with the lowest value first.
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html.
 *
 * @param left - A Signer to compare with.
 * @param right - A second Signer to compare with.
 * @returns 1 if left \> right, 0 if left = right, -1 if left \< right, and null if left or right are NaN.
 */
function compareSigners(left: Signer, right: Signer): number {
  return addressToBigNumber(left.Signer.Account).comparedTo(
    addressToBigNumber(right.Signer.Account),
  )
}

function addressToBigNumber(address: string): BigNumber {
  const hex = Buffer.from(decodeAccountID(address)).toString('hex')
  const numberOfBitsInHex = 16
  return new BigNumber(hex, numberOfBitsInHex)
}

function getDecodedTransaction(txOrBlob: Transaction | string): Transaction {
  if (typeof txOrBlob === 'object') {
    return txOrBlob
  }

  return decode(txOrBlob) as unknown as Transaction
}

export { sign, authorizeChannel, verifySignature, multisign }
