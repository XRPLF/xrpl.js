/* eslint-disable import/max-dependencies */
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

import { SignOptions } from '..'
import { ValidationError } from '../common/errors'
import { Signer } from '../models/common'
import { Transaction } from '../models/transactions'
import { verifyBaseTransaction } from '../models/transactions/common'

import Wallet from '.'

/**
 * Uses a wallet to cryptographically sign a transaction which proves the owner of the wallet
 * is issuing this transaction.
 *
 * @param wallet - A Wallet that holds your cryptographic keys.
 * @param tx - The Transaction that is being signed.
 * @param forMultisign - If true, changes the signature format to encode for multisigning.
 * @returns A signed Transaction.
 */
function sign(
  wallet: Wallet,
  tx: Transaction,
  options: SignOptions = { signAs: '' },
): string {
  return signTransaction(tx, wallet.publicKey, wallet.privateKey, options)
  /*wallet.signTransaction(
    tx,
    forMultisign ? { signAs: wallet.getClassicAddress() } : { signAs: '' },
  )*/
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- verify does not accept Transaction type
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
 * @param wallet - The account that will sign for this payment channel.
 * @param channelId - An id for the payment channel to redeem XRP from.
 * @param amount - The amount in drops to redeem.
 * @returns A signature that can be used to redeem a specific amount of XRP from a payment channel.
 */
function authorizeChannel(
  wallet: Wallet,
  channelId: string,
  amount: string,
): string {
  const signingData = encodeForSigningClaim({
    channel: channelId,
    amount,
  })

  return signWithKeypair(signingData, wallet.privateKey)
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

function signTransaction(
  tx: Transaction,
  publicKey: string,
  privateKey: string,
  options: SignOptions = {
    signAs: '',
  },
): string {
  if (tx.TxnSignature || tx.Signers) {
    throw new ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties',
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

function computeSignature(tx: JSON, privateKey: string, signAs?: string) {
  const signingData = signAs
    ? encodeForMultisigning(tx, signAs)
    : encodeForSigning(tx)
  return signWithKeypair(signingData, privateKey)
}

/**
 * Compares two objects and creates a diff.
 *
 * @param a - An object to compare.
 * @param b - The other object to compare with.
 *
 * @returns An object containing the differences between the two objects.
 */
function objectDiff(a: object, b: object): object {
  const diffs = {}

  // Compare two items and push non-matches to object
  const compare = function (i1: any, i2: any, k: string): void {
    const type1 = Object.prototype.toString.call(i1)
    const type2 = Object.prototype.toString.call(i2)
    if (type2 === '[object Undefined]') {
      diffs[k] = null // Indicate that the item has been removed
      return
    }
    if (type1 !== type2) {
      diffs[k] = i2 // Indicate that the item has changed types
      return
    }
    if (type1 === '[object Object]') {
      const objDiff = objectDiff(i1, i2)
      if (Object.keys(objDiff).length > 0) {
        diffs[k] = objDiff
      }
      return
    }
    if (type1 === '[object Array]') {
      if (!isEqual(i1, i2)) {
        diffs[k] = i2 // If arrays do not match, add second item to diffs
      }
      return
    }
    if (type1 === '[object Function]') {
      if (i1.toString() !== i2.toString()) {
        diffs[k] = i2 // If functions differ, add second one to diffs
      }
      return
    }
    if (i1 !== i2) {
      diffs[k] = i2
    }
  }

  // Check items in first object
  for (const key in a) {
    if (a.hasOwnProperty(key)) {
      compare(a[key], b[key], key)
    }
  }

  // Get items that are in the second object but not the first
  for (const key in b) {
    if (b.hasOwnProperty(key)) {
      if (!a[key] && a[key] !== b[key]) {
        diffs[key] = b[key]
      }
    }
  }

  return diffs
}

/**
 *  Decode a serialized transaction, remove the fields that are added during the signing process,
 *  and verify that it matches the transaction prior to signing.
 *
 * @param serialized - A signed and serialized transaction.
 * @param tx - The transaction prior to signing.
 * @throws
 *
 * @returns This method does not return a value, but throws an error if the check fails.
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

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
  return decode(txOrBlob) as unknown as Transaction
}

export { sign, authorizeChannel, verifySignature, multisign }
