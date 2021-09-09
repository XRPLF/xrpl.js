import { xAddressToClassicAddress } from 'ripple-address-codec'

import { ValidationError } from '../common/errors'
import { RippledAmount } from '../common/types/objects'

import { deriveKeypair, deriveAddress, deriveXAddress } from './derive'
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
  computeEscrowHash,
  computePaymentChannelHash,
} from './hashes'
import signPaymentChannelClaim from './signPaymentChannelClaim'
import verifyPaymentChannelClaim from './verifyPaymentChannelClaim'
import { xrpToDrops, dropsToXrp } from './xrpConversion'

const RIPPLE_EPOCH_DIFF = 0x386d4380

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

/**
 * Convert a ripple timestamp to a unix timestamp.
 *
 * @param rpepoch - (seconds since 1/1/2000 GMT).
 * @returns Milliseconds since unix epoch.
 */
function rippleToUnixTimestamp(rpepoch: number): number {
  return (rpepoch + RIPPLE_EPOCH_DIFF) * 1000
}

/**
 * Convert a unix timestamp to a ripple timestamp.
 *
 * @param timestamp - (ms since unix epoch).
 * @returns Seconds since Ripple Epoch (1/1/2000 GMT).
 */
function unixToRippleTimestamp(timestamp: number): number {
  return Math.round(timestamp / 1000) - RIPPLE_EPOCH_DIFF
}

/**
 * Convert a ripple timestamp to an Iso8601 timestamp.
 *
 * @param rippleTime - Is the number of seconds since Ripple Epoch (1/1/2000 GMT).
 * @returns Iso8601 international standard date format.
 */
function rippleTimeToISOTime(rippleTime: number): string {
  return new Date(rippleToUnixTimestamp(rippleTime)).toISOString()
}

/**
 * Convert an Iso8601 timestmap to a ripple timestamp.
 *
 * @param iso8601 - International standard date format.
 * @returns Seconds since ripple epoch (1/1/2000 GMT).
 */
function ISOTimeToRippleTime(iso8601: string): number {
  return unixToRippleTimestamp(Date.parse(iso8601))
}

export {
  computeLedgerHeaderHash,
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
  computeEscrowHash,
  computePaymentChannelHash,
  generateXAddress,
  deriveKeypair,
  deriveAddress,
  deriveXAddress,
  signPaymentChannelClaim,
  verifyPaymentChannelClaim,
}
