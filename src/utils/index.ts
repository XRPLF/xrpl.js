import {
  classicAddressToXAddress,
  decodeAccountID,
  decodeAccountPublic,
  decodeNodePublic,
  decodeSeed,
  decodeXAddress,
  encodeAccountID,
  encodeAccountPublic,
  encodeNodePublic,
  encodeSeed,
  encodeXAddress,
  isValidClassicAddress,
  isValidXAddress,
  xAddressToClassicAddress,
} from 'ripple-address-codec'

import { Response } from '../models/methods'

import getBalanceChanges from './balanceChanges'
import { deriveKeypair, deriveXAddress } from './derive'
import { generateXAddress } from './generateAddress'
import {
  hashSignedTx,
  hashTx,
  hashAccountRoot,
  hashSignerListId,
  hashOfferId,
  hashTrustline,
  hashTxTree,
  hashStateTree,
  hashLedger,
  hashLedgerHeader,
  hashEscrow,
  hashPaymentChannel,
} from './hashes'
import signPaymentChannelClaim from './signPaymentChannelClaim'
import {
  rippleTimeToISOTime,
  ISOTimeToRippleTime,
  rippleTimeToUnixTime,
  unixTimeToRippleTime,
} from './timeConversion'
import verifyPaymentChannelClaim from './verifyPaymentChannelClaim'
import { xrpToDrops, dropsToXrp } from './xrpConversion'

/**
 * Check if a secret is valid.
 *
 * @param secret - Secret to test for validity.
 * @returns True if secret can be derived into a keypair.
 * @category Utilities
 */
function isValidSecret(secret: string): boolean {
  try {
    deriveKeypair(secret)
    return true
  } catch (_err) {
    return false
  }
}

/**
 * Validates that a given address is a valid X-Address or a valid classic
 * address.
 *
 * @param address - Address to validate.
 * @returns True if address is a valid X-Address or classic address.
 */
function isValidAddress(address: string): boolean {
  return isValidXAddress(address) || isValidClassicAddress(address)
}

/**
 * Converts a string to its hex equivalent. Useful for Memos.
 *
 * @param string - The string to convert to Hex.
 * @returns The Hex equivalent of the string.
 */
function convertStringToHex(string: string): string {
  return Buffer.from(string, 'utf8').toString('hex').toUpperCase()
}

/**
 * Returns true if there are more pages of data.
 *
 * When there are more results than contained in the response, the response
 * includes a `marker` field.
 *
 * See https://ripple.com/build/rippled-apis/#markers-and-pagination.
 *
 * @param response - Response to check for more pages on.
 * @returns Whether the response has more pages of data.
 */
function hasNextPage(response: Response): boolean {
  // eslint-disable-next-line @typescript-eslint/dot-notation -- only checking if it exists
  return Boolean(response.result['marker'])
}

const hashes = {
  hashSignedTx,
  hashTx,
  hashAccountRoot,
  hashSignerListId,
  hashOfferId,
  hashTrustline,
  hashTxTree,
  hashStateTree,
  hashLedger,
  hashLedgerHeader,
  hashEscrow,
  hashPaymentChannel,
}

export {
  getBalanceChanges,
  dropsToXrp,
  xrpToDrops,
  hasNextPage,
  rippleTimeToISOTime,
  ISOTimeToRippleTime,
  rippleTimeToUnixTime,
  unixTimeToRippleTime,
  isValidSecret,
  isValidAddress,
  hashes,
  generateXAddress,
  deriveKeypair,
  deriveXAddress,
  signPaymentChannelClaim,
  verifyPaymentChannelClaim,
  convertStringToHex,
  classicAddressToXAddress,
  xAddressToClassicAddress,
  isValidXAddress,
  isValidClassicAddress,
  encodeSeed,
  decodeSeed,
  encodeAccountID,
  decodeAccountID,
  encodeNodePublic,
  decodeNodePublic,
  encodeAccountPublic,
  decodeAccountPublic,
  encodeXAddress,
  decodeXAddress,
}
