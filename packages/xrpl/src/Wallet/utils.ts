import { bytesToHex } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'
import { decodeAccountID } from 'ripple-address-codec'
import { decode, encode } from 'ripple-binary-codec'

import { Transaction } from '../models'

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
export function compareSigners<T extends { Account: string }>(
  left: T,
  right: T,
): number {
  return addressToBigNumber(left.Account).comparedTo(
    addressToBigNumber(right.Account),
  )
}

export const NUM_BITS_IN_HEX = 16

/**
 * Converts an address to a BigNumber.
 *
 * @param address - The address to convert.
 * @returns A BigNumber representing the address.
 */
export function addressToBigNumber(address: string): BigNumber {
  const hex = bytesToHex(decodeAccountID(address))
  return new BigNumber(hex, NUM_BITS_IN_HEX)
}

/**
 * Decodes a transaction or transaction blob into a Transaction object.
 *
 * @param txOrBlob - A Transaction object or a hex string representing a transaction blob.
 * @returns A Transaction object.
 * @throws If the input is not a valid Transaction or transaction blob.
 */
export function getDecodedTransaction(
  txOrBlob: Transaction | string,
): Transaction {
  if (typeof txOrBlob === 'object') {
    // We need this to handle X-addresses in multisigning
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
    return decode(encode(txOrBlob)) as unknown as Transaction
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
  return decode(txOrBlob) as unknown as Transaction
}
