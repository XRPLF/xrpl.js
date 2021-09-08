import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { xAddressToClassicAddress } from 'ripple-address-codec'

import { ValidationError } from '../common/errors'
import { RippledAmount } from '../common/types/objects'

import { deriveKeypair, deriveAddress, deriveXAddress } from './derive'
import { generateXAddress } from './generateAddress'
import {
  computeBinaryTransactionHash,
  computeTransactionHash,
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
import computeLedgerHeaderHash from './ledgerHash'
import signPaymentChannelClaim from './signPaymentChannelClaim'
import verifyPaymentChannelClaim from './verifyPaymentChannelClaim'

function isValidSecret(secret: string): boolean {
  try {
    deriveKeypair(secret)
    return true
  } catch (err) {
    return false
  }
}

function dropsToXrp(drops: BigNumber.Value): string {
  if (typeof drops === 'string') {
    if (!/^-?[0-9]*\.?[0-9]*$/.exec(drops)) {
      throw new ValidationError(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`,
      )
    } else if (drops === '.') {
      throw new ValidationError(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a BigNumber or string-encoded number.`,
      )
    }
  }

  // Converting to BigNumber and then back to string should remove any
  // decimal point followed by zeros, e.g. '1.00'.
  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  drops = new BigNumber(drops).toString(10)

  // drops are only whole units
  if (drops.includes('.')) {
    throw new ValidationError(
      `dropsToXrp: value '${drops}' has` + ` too many decimal places.`,
    )
  }

  // This should never happen; the value has already been
  // validated above. This just ensures BigNumber did not do
  // something unexpected.
  if (!/^-?[0-9]+$/.exec(drops)) {
    throw new ValidationError(
      `dropsToXrp: failed sanity check -` +
        ` value '${drops}',` +
        ` does not match (^-?[0-9]+$).`,
    )
  }

  return new BigNumber(drops).dividedBy(1000000.0).toString(10)
}

function xrpToDrops(xrp: BigNumber.Value): string {
  if (typeof xrp === 'string') {
    if (!/^-?[0-9]*\.?[0-9]*$/.exec(xrp)) {
      throw new ValidationError(
        `xrpToDrops: invalid value '${xrp}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`,
      )
    } else if (xrp === '.') {
      throw new ValidationError(
        `xrpToDrops: invalid value '${xrp}',` +
          ` should be a BigNumber or string-encoded number.`,
      )
    }
  }

  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  xrp = new BigNumber(xrp).toString(10)

  // This should never happen; the value has already been
  // validated above. This just ensures BigNumber did not do
  // something unexpected.
  if (!/^-?[0-9.]+$/.exec(xrp)) {
    throw new ValidationError(
      `xrpToDrops: failed sanity check -` +
        ` value '${xrp}',` +
        ` does not match (^-?[0-9.]+$).`,
    )
  }

  const components = xrp.split('.')
  if (components.length > 2) {
    throw new ValidationError(
      `xrpToDrops: failed sanity check -` +
        ` value '${xrp}' has` +
        ` too many decimal points.`,
    )
  }

  const fraction = components[1] || '0'
  if (fraction.length > 6) {
    throw new ValidationError(
      `xrpToDrops: value '${xrp}' has` + ` too many decimal places.`,
    )
  }

  return new BigNumber(xrp)
    .times(1000000.0)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toString(10)
}

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

  let issuer = amount.counterparty || amount.issuer
  let tag: number | false = false

  try {
    if (issuer) {
      ;({ classicAddress: issuer, tag } = xAddressToClassicAddress(issuer))
    }
  } catch (e) {
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

function convertKeysFromSnakeCaseToCamelCase(obj: any): any {
  if (typeof obj === 'object') {
    const accumulator = Array.isArray(obj) ? [] : {}
    let newKey
    return Object.entries(obj).reduce((result, [key, value]) => {
      newKey = key
      // taking this out of function leads to error in PhantomJS
      const FINDSNAKE = /([a-zA-Z]_[a-zA-Z])/g
      if (FINDSNAKE.test(key)) {
        newKey = key.replace(FINDSNAKE, (r) => r[0] + r[2].toUpperCase())
      }
      result[newKey] = convertKeysFromSnakeCaseToCamelCase(value)
      return result
    }, accumulator)
  }
  return obj
}

function removeUndefined<T extends object>(obj: T): T {
  return _.omitBy(obj, (value) => value == null) as T
}

/**
 * @param rpepoch - (seconds since 1/1/2000 GMT).
 * @returns Milliseconds since unix epoch.
 */
function rippleToUnixTimestamp(rpepoch: number): number {
  return (rpepoch + 0x386d4380) * 1000
}

/**
 * @param timestamp - (ms since unix epoch).
 * @returns Seconds since Ripple Epoch (1/1/2000 GMT).
 */
function unixToRippleTimestamp(timestamp: number): number {
  return Math.round(timestamp / 1000) - 0x386d4380
}

/**
 * @param rippleTime - Is the number of seconds since Ripple Epoch (1/1/2000 GMT).
 * @returns Iso8601 international standard date format.
 */
function rippleTimeToISOTime(rippleTime: number): string {
  return new Date(rippleToUnixTimestamp(rippleTime)).toISOString()
}

/**
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
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  rippleTimeToISOTime,
  ISOTimeToRippleTime,
  isValidSecret,
  computeBinaryTransactionHash,
  computeTransactionHash,
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
