import { BigNumber } from 'bignumber.js'
import { flatMap } from 'lodash'
import { decodeAccountID } from 'ripple-address-codec'
import {
  decode,
  encodeForSigning,
  encodeForSigningClaim,
} from 'ripple-binary-codec'
import { sign as signWithKeypair, verify } from 'ripple-keypairs'

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
function sign(wallet: Wallet, tx: Transaction, forMultisign = false): string {
  return wallet.signTransaction(
    tx,
    forMultisign ? { signAs: wallet.getClassicAddress() } : { signAs: '' },
  )
}

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
