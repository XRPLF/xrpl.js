import { Decimal } from 'decimal.js'

import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { Currency } from './currency'
import { JsonObject, SerializedType } from './serialized-type'
import bigInt = require('big-integer')
import { Buffer } from 'buffer/'

/**
 * Constants for validating amounts
 */
const MIN_IOU_EXPONENT = -96
const MAX_IOU_EXPONENT = 80
const MAX_IOU_PRECISION = 16
const MAX_DROPS = new Decimal('1e17')
const MIN_XRP = new Decimal('1e-6')
const mask = bigInt(0x00000000ffffffff)

/**
 * decimal.js configuration for Amount IOUs
 */
Decimal.config({
  toExpPos: MAX_IOU_EXPONENT + MAX_IOU_PRECISION,
  toExpNeg: MIN_IOU_EXPONENT - MAX_IOU_PRECISION,
})

/**
 * Interface for JSON objects that represent amounts
 */
interface AmountObject extends JsonObject {
  value: string
  currency: string
  issuer: string
}

/**
 * Type guard for AmountObject
 */
function isAmountObject(arg): arg is AmountObject {
  const keys = Object.keys(arg).sort()
  return (
    keys.length === 3 &&
    keys[0] === 'currency' &&
    keys[1] === 'issuer' &&
    keys[2] === 'value'
  )
}

/**
 * Class for serializing/Deserializing Amounts
 */
class Amount extends SerializedType {
  static defaultAmount: Amount = new Amount(
    Buffer.from('4000000000000000', 'hex'),
  )

  constructor(bytes: Buffer) {
    super(bytes ?? Amount.defaultAmount.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, or a string
   *     representing an integer amount
   * @returns An Amount object
   */
  static from<T extends Amount | AmountObject | string>(value: T): Amount {
    if (value instanceof Amount) {
      return value
    }

    let amount = Buffer.alloc(8)
    if (typeof value === 'string') {
      Amount.assertXrpIsValid(value)

      const number = bigInt(value)

      const intBuf = [Buffer.alloc(4), Buffer.alloc(4)]
      intBuf[0].writeUInt32BE(Number(number.shiftRight(32)), 0)
      intBuf[1].writeUInt32BE(Number(number.and(mask)), 0)

      amount = Buffer.concat(intBuf)

      amount[0] |= 0x40

      return new Amount(amount)
    }

    if (isAmountObject(value)) {
      const number = new Decimal(value.value)
      Amount.assertIouIsValid(number)

      if (number.isZero()) {
        amount[0] |= 0x80
      } else {
        const integerNumberString = number
          .times(`1e${-(number.e - 15)}`)
          .abs()
          .toString()

        const num = bigInt(integerNumberString)
        const intBuf = [Buffer.alloc(4), Buffer.alloc(4)]
        intBuf[0].writeUInt32BE(Number(num.shiftRight(32)), 0)
        intBuf[1].writeUInt32BE(Number(num.and(mask)), 0)

        amount = Buffer.concat(intBuf)

        amount[0] |= 0x80

        if (number.gt(new Decimal(0))) {
          amount[0] |= 0x40
        }

        const exponent = number.e - 15
        const exponentByte = 97 + exponent
        amount[0] |= exponentByte >>> 2
        amount[1] |= (exponentByte & 0x03) << 6
      }

      const currency = Currency.from(value.currency).toBytes()
      const issuer = AccountID.from(value.issuer).toBytes()
      return new Amount(Buffer.concat([amount, currency, issuer]))
    }

    throw new Error('Invalid type to construct an Amount')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @returns An Amount object
   */
  static fromParser(parser: BinaryParser): Amount {
    const isXRP = parser.peek() & 0x80
    const numBytes = isXRP ? 48 : 8
    return new Amount(parser.read(numBytes))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): AmountObject | string {
    if (this.isNative()) {
      const bytes = this.bytes
      const isPositive = bytes[0] & 0x40
      const sign = isPositive ? '' : '-'
      bytes[0] &= 0x3f

      const msb = bigInt(bytes.slice(0, 4).readUInt32BE(0))
      const lsb = bigInt(bytes.slice(4).readUInt32BE(0))
      const num = msb.shiftLeft(32).or(lsb)

      return `${sign}${num.toString()}`
    } else {
      const parser = new BinaryParser(this.toString())
      const mantissa = parser.read(8)
      const currency = Currency.fromParser(parser) as Currency
      const issuer = AccountID.fromParser(parser) as AccountID

      const b1 = mantissa[0]
      const b2 = mantissa[1]

      const isPositive = b1 & 0x40
      const sign = isPositive ? '' : '-'
      const exponent = ((b1 & 0x3f) << 2) + ((b2 & 0xff) >> 6) - 97

      mantissa[0] = 0
      mantissa[1] &= 0x3f
      const value = new Decimal(`${sign}0x${mantissa.toString('hex')}`).times(
        `1e${exponent}`,
      )
      Amount.assertIouIsValid(value)

      return {
        value: value.toString(),
        currency: currency.toJSON(),
        issuer: issuer.toJSON(),
      }
    }
  }

  /**
   * Validate XRP amount
   *
   * @param amount String representing XRP amount
   * @returns void, but will throw if invalid amount
   */
  private static assertXrpIsValid(amount: string): void {
    if (amount.indexOf('.') !== -1) {
      throw new Error(`${amount.toString()} is an illegal amount`)
    }

    const decimal = new Decimal(amount)
    if (!decimal.isZero()) {
      if (decimal.lt(MIN_XRP) || decimal.gt(MAX_DROPS)) {
        throw new Error(`${amount.toString()} is an illegal amount`)
      }
    }
  }

  /**
   * Validate IOU.value amount
   *
   * @param decimal Decimal.js object representing IOU.value
   * @returns void, but will throw if invalid amount
   */
  private static assertIouIsValid(decimal: Decimal): void {
    if (!decimal.isZero()) {
      const p = decimal.precision()
      const e = decimal.e - 15
      if (
        p > MAX_IOU_PRECISION ||
        e > MAX_IOU_EXPONENT ||
        e < MIN_IOU_EXPONENT
      ) {
        throw new Error('Decimal precision out of range')
      }
      this.verifyNoDecimal(decimal)
    }
  }

  /**
   * Ensure that the value after being multiplied by the exponent does not
   * contain a decimal.
   *
   * @param decimal a Decimal object
   * @returns a string of the object without a decimal
   */
  private static verifyNoDecimal(decimal: Decimal): void {
    const integerNumberString = decimal
      .times(`1e${-(decimal.e - 15)}`)
      .abs()
      .toString()

    if (integerNumberString.indexOf('.') !== -1) {
      throw new Error('Decimal place found in integerNumberString')
    }
  }

  /**
   * Test if this amount is in units of Native Currency(XRP)
   *
   * @returns true if Native (XRP)
   */
  private isNative(): boolean {
    return (this.bytes[0] & 0x80) === 0
  }
}

export { Amount, AmountObject }
