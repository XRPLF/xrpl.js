import BigNumber from 'bignumber.js'
import { concat } from '@xrplf/isomorphic/utils'

import { writeUInt32BE } from '../utils'

import { Amount, AmountObject } from './amount'

const MAX_DROPS = new BigNumber('1e17')
const MIN_XRP = new BigNumber('1e-6')
const mask = BigInt(0x00000000ffffffff)

/**
 * SignedAmount serializes a native XRP magnitude that may be negative.
 *
 * Regular native XRP amounts (Fee, Amount, TakerPays, etc.) can never be
 * negative, so `Amount` continues to reject negative values for those
 * fields. SignedAmount exists only for a small set of fields (such as
 * FeeAmountDelta) whose value is a signed delta -- rippled's STAmount
 * permits a negative native magnitude for these, encoded with the same
 * bit layout as a regular native amount except the "positive" bit (0x40 in
 * the leading byte) is left clear for negative values. Decoding is
 * unaffected and inherited from Amount, since Amount.toJSON() already
 * interprets that bit correctly regardless of which class parsed the bytes.
 */
class SignedAmount extends Amount {
  static from<T extends Amount | AmountObject | string>(
    value: T,
  ): SignedAmount {
    if (value instanceof Amount) {
      // Covers both a SignedAmount instance and a plain Amount instance --
      // the latter shows up when re-serializing a value that was just read
      // via Amount.fromParser (inherited unchanged by SignedAmount, since
      // decoding a signed native amount is no different from decoding a
      // regular one). The wire bytes are already correct in both cases.
      return value instanceof SignedAmount
        ? value
        : new SignedAmount(value.toBytes())
    }

    if (typeof value !== 'string') {
      throw new Error('SignedAmount only supports native XRP string values')
    }

    return SignedAmount.fromString(value)
  }

  private static fromString(value: string): SignedAmount {
    if (value.indexOf('.') !== -1) {
      throw new Error(`${value} is an illegal amount`)
    }

    let decimal: BigNumber
    try {
      decimal = new BigNumber(value)
    } catch (_err) {
      throw new Error(`${value} is an illegal amount`)
    }
    if (decimal.isNaN()) {
      throw new Error(`${value} is an illegal amount`)
    }
    if (!decimal.isZero()) {
      const magnitude = decimal.abs()
      if (magnitude.lt(MIN_XRP) || magnitude.gt(MAX_DROPS)) {
        throw new Error(`${value} is an illegal amount`)
      }
    }

    const number = BigInt(value)
    const isNegative = number < BigInt(0)
    const magnitude = isNegative ? -number : number

    const intBuf = [new Uint8Array(4), new Uint8Array(4)]
    writeUInt32BE(intBuf[0], Number(magnitude >> BigInt(32)), 0)
    writeUInt32BE(intBuf[1], Number(magnitude & BigInt(mask)), 0)

    const amount = concat(intBuf)
    if (!isNegative) {
      amount[0] |= 0x40
    }

    return new SignedAmount(amount)
  }
}

export { SignedAmount }
