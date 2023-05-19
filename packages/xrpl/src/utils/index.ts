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
import * as rbc from 'ripple-binary-codec'
import { verify as verifyKeypairSignature } from 'ripple-keypairs'

import { LedgerEntry } from '../models/ledger'
import { Response } from '../models/methods'
import { PaymentChannelClaim } from '../models/transactions/paymentChannelClaim'
import { Transaction } from '../models/transactions/transaction'

import { deriveKeypair, deriveAddress, deriveXAddress } from './derive'
import getBalanceChanges from './getBalanceChanges'
import getNFTokenID from './getNFTokenID'
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
import parseNFTokenID from './parseNFTokenID'
import {
  percentToTransferRate,
  decimalToTransferRate,
  transferRateToDecimal,
  percentToQuality,
  decimalToQuality,
  qualityToDecimal,
} from './quality'
import signPaymentChannelClaim from './signPaymentChannelClaim'
import { convertHexToString, convertStringToHex } from './stringConversion'
import {
  rippleTimeToISOTime,
  isoTimeToRippleTime,
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
 * Encodes a LedgerEntry or Transaction into a hex string
 *
 * @param object - LedgerEntry or Transaction in JSON format.
 * @returns A hex string representing the encoded object.
 */
function encode(object: Transaction | LedgerEntry): string {
  return rbc.encode(object)
}

/**
 * Encodes a Transaction for signing
 *
 * @param object - LedgerEntry in JSON or Transaction format.
 * @returns A hex string representing the encoded object.
 */
function encodeForSigning(object: Transaction): string {
  return rbc.encodeForSigning(object)
}

/**
 * Encodes a PaymentChannelClaim for signing
 *
 * @param object - PaymentChannelClaim in JSON format.
 * @returns A hex string representing the encoded object.
 */
function encodeForSigningClaim(object: PaymentChannelClaim): string {
  return rbc.encodeForSigningClaim(object)
}

/**
 * Encodes a Transaction for multi-signing
 *
 * @param object - Transaction in JSON format.
 * @param signer - The address of the account signing this transaction
 * @returns A hex string representing the encoded object.
 */
function encodeForMultiSigning(object: Transaction, signer: string): string {
  return rbc.encodeForMultisigning(object, signer)
}

/**
 * Decodes a hex string into a transaction | ledger entry
 *
 * @param hex - hex string in the XRPL serialization format.
 * @returns The hex string decoded according to XRPL serialization format.
 */
function decode(hex: string): Record<string, unknown> {
  return rbc.decode(hex)
}

/**
 * Validates that a given address is a valid X-Address or a valid classic
 * address.
 *
 * @param address - Address to validate.
 * @returns True if address is a valid X-Address or classic address.
 * @category Utilities
 */
function isValidAddress(address: string): boolean {
  return isValidXAddress(address) || isValidClassicAddress(address)
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
 * @category Utilities
 */
function hasNextPage(response: Response): boolean {
  // eslint-disable-next-line @typescript-eslint/dot-notation -- only checking if it exists
  return Boolean(response.result['marker'])
}

/**
 * @category Utilities
 */
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
  isoTimeToRippleTime,
  rippleTimeToUnixTime,
  unixTimeToRippleTime,
  percentToQuality,
  decimalToQuality,
  percentToTransferRate,
  decimalToTransferRate,
  transferRateToDecimal,
  qualityToDecimal,
  isValidSecret,
  isValidAddress,
  hashes,
  deriveKeypair,
  deriveAddress,
  deriveXAddress,
  signPaymentChannelClaim,
  verifyKeypairSignature,
  verifyPaymentChannelClaim,
  convertStringToHex,
  convertHexToString,
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
  encode,
  decode,
  encodeForMultiSigning,
  encodeForSigning,
  encodeForSigningClaim,
  getNFTokenID,
  parseNFTokenID,
}
