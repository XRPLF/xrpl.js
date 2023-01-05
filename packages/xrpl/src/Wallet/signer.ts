import { BigNumber } from 'bignumber.js'
import { flatMap } from 'lodash'
import { decodeAccountID } from 'ripple-address-codec'
import {
  decode,
  encode,
  encodeForSigning,
  encodeForSigningClaim,
  XrplDefinitionsBase,
} from 'ripple-binary-codec'
import { sign as signWithKeypair, verify } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Signer } from '../models/common'
import {
  type BaseTransaction,
  type Transaction,
  validate,
} from '../models/transactions'

import Wallet from '.'

/**
 * Takes several transactions with Signer fields (in object or blob form) and creates a
 * single transaction with all Signers that then gets signed and returned.
 *
 * @param transactions - An array of signed Transactions (in object or blob form) to combine into a single signed Transaction.
 * @param definitions - Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns A single signed Transaction which has all Signers from transactions within it.
 * @throws ValidationError if:
 * - There were no transactions given to sign
 * - The SigningPubKey field is not the empty string in any given transaction
 * - Any transaction is missing a Signers field.
 * @category Signing
 */
function multisign<T extends BaseTransaction = Transaction>(
  transactions: Array<T | string>,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): string {
  if (transactions.length === 0) {
    throw new ValidationError('There were 0 transactions to multisign')
  }

  transactions.forEach((txOrBlob) => {
    const tx: BaseTransaction = getDecodedTransaction(txOrBlob, definitions)

    /*
     * This will throw a more clear error for JS users if any of the supplied transactions has incorrect formatting
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
    validate(tx as unknown as Record<string, unknown>, definitions)
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

  const decodedTransactions = transactions.map((txOrBlob: string | T) => {
    return getDecodedTransaction(txOrBlob, definitions)
  })

  validateTransactionEquivalence(decodedTransactions)

  return encode(getTransactionWithAllSigners(decodedTransactions), definitions)
}

/**
 * Creates a signature that can be used to redeem a specific amount of XRP from a payment channel.
 *
 * @param wallet - The account that will sign for this payment channel.
 * @param channelId - An id for the payment channel to redeem XRP from.
 * @param amount - The amount in drops to redeem.
 * @param definitions - Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns A signature that can be used to redeem a specific amount of XRP from a payment channel.
 * @category Utilities
 */
// eslint-disable-next-line max-params -- Parameters are necessary
function authorizeChannel(
  wallet: Wallet,
  channelId: string,
  amount: string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): string {
  const signingData = encodeForSigningClaim(
    {
      channel: channelId,
      amount,
    },
    definitions,
  )

  return signWithKeypair(signingData, wallet.privateKey)
}

/**
 * Verifies that the given transaction has a valid signature based on public-key encryption.
 *
 * @param tx - A transaction to verify the signature of. (Can be in object or encoded string format).
 * @param definitions - Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns Returns true if tx has a valid signature, and returns false otherwise.
 * @category Utilities
 */
function verifySignature<T extends BaseTransaction = Transaction>(
  tx: T | string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): boolean {
  const decodedTx = getDecodedTransaction(tx)
  return verify(
    encodeForSigning(decodedTx, definitions),
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
function validateTransactionEquivalence<
  T extends BaseTransaction = Transaction,
>(transactions: T[]): void {
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

function getTransactionWithAllSigners<T extends BaseTransaction = Transaction>(
  transactions: T[],
): T {
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

/**
 * Normalizes txOrBlob to Transaction format.
 *
 * @param txOrBlob - the transaction either Transaction or blob format.
 * @param definitions - Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns txOrBlob in Transaction format.
 */
function getDecodedTransaction<T extends BaseTransaction = Transaction>(
  txOrBlob: T | string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): T {
  if (typeof txOrBlob === 'object') {
    // We need this to handle X-addresses in multisigning
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
    return decode(encode(txOrBlob, definitions), definitions) as unknown as T
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
  return decode(txOrBlob, definitions) as unknown as T
}

export { authorizeChannel, verifySignature, multisign }
