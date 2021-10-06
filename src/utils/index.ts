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

import getBalanceChanges from './balanceChanges'
import { deriveKeypair, deriveXAddress } from './derive'
import { generateXAddress } from './generateAddress'
import {
  computeSignedTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountRootIndex,
  computeSignerListIndex,
  computeOfferIndex,
  computeTrustlineHash,
  computeTransactionTreeHash,
  computeStateTreeHash,
  computeLedgerHash,
  computeLedgerHeaderHash,
  computeEscrowHash,
  computePaymentChannelHash,
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
 * Removes undefined values from an object.
 *
 * @param obj - Object to remove undefined values from.
 * @returns The same object, but without undefined values.
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const newObj = { ...obj }

  Object.entries(obj).forEach(([key, value]) => {
    if (value == null) {
      /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Deletes undefined values. */
      delete newObj[key]
    }
  })

  return newObj
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

export {
  getBalanceChanges,
  dropsToXrp,
  xrpToDrops,
  removeUndefined,
  rippleTimeToISOTime,
  ISOTimeToRippleTime,
  rippleTimeToUnixTime,
  unixTimeToRippleTime,
  isValidSecret,
  isValidAddress,
  computeSignedTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountRootIndex,
  computeSignerListIndex,
  computeOfferIndex,
  computeTrustlineHash,
  computeTransactionTreeHash,
  computeStateTreeHash,
  computeLedgerHash,
  computeLedgerHeaderHash,
  computeEscrowHash,
  computePaymentChannelHash,
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
