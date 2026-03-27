import { bytesToHex } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'
import {
  decodeAccountID,
  isValidXAddress,
  xAddressToClassicAddress,
} from 'ripple-address-codec'
import {
  decode,
  encode,
  encodeForMultisigning,
  encodeForSigning,
} from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { Transaction } from '../models'

/**
 * If presented in binary form, the Signers array must be sorted based on
 * the numeric value of the signer addresses, with the lowest value first.
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html.
 *
 * @param left - A Signer to compare with.
 * @param right - A second Signer to compare with.
 * @returns 1 if left \> right, 0 if left = right, -1 if left \< right.
 * @throws Error if either Account is null, undefined, or invalid.
 */
export function compareSigners<T extends { Account: string }>(
  left: T,
  right: T,
): number {
  if (!left.Account || !right.Account) {
    throw new Error('compareSigners: Account cannot be null or undefined')
  }
  const result = addressToBigNumber(left.Account).comparedTo(
    addressToBigNumber(right.Account),
  )
  if (result === null) {
    throw new Error(
      'compareSigners: Invalid account address comparison resulted in NaN',
    )
  }
  return result
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

/**
 * Signs a transaction with the proper signing encoding.
 *
 * @param tx - A transaction to sign.
 * @param privateKey - A key to sign the transaction with.
 * @param signAs - Multisign only. An account address to include in the Signer field.
 * Can be either a classic address or an XAddress.
 * @returns A signed transaction in the proper format.
 */
export function computeSignature(
  tx: Transaction,
  privateKey: string,
  signAs?: string,
): string {
  if (signAs) {
    const classicAddress = isValidXAddress(signAs)
      ? xAddressToClassicAddress(signAs).classicAddress
      : signAs

    return sign(encodeForMultisigning(tx, classicAddress), privateKey)
  }
  return sign(encodeForSigning(tx), privateKey)
}
