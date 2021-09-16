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

import { ValidationError } from '../common/errors'
import { RippledAmount } from '../common/types/objects'

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
import { rippleTimeToISOTime, ISOTimeToRippleTime } from './timeConversion'
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
 * TODO: Remove/rename this function.
 *
 * @param amount - Convert an Amount in.
 * @returns Amount without X-Address issuer.
 * @throws When issuer X-Address includes a tag.
 */
function toRippledAmount(amount: RippledAmount): RippledAmount {
  if (typeof amount === 'string') {
    return amount
  }

  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value)
  }
  if (amount.currency === 'drops') {
    return amount.value
  }

  let issuer = amount.counterparty ?? amount.issuer
  let tag: number | false = false

  try {
    if (issuer) {
      ;({ classicAddress: issuer, tag } = xAddressToClassicAddress(issuer))
    }
  } catch (_e) {
    /* not an X-address */
  }

  if (tag !== false) {
    throw new ValidationError('Issuer X-address includes a tag')
  }

  return {
    currency: amount.currency,
    issuer,
    value: amount.value,
  }
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

function convertStringToHex(string: string): string {
  return Buffer.from(string, 'utf8').toString('hex').toUpperCase()
}

export {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  removeUndefined,
  rippleTimeToISOTime,
  ISOTimeToRippleTime,
  isValidSecret,
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
