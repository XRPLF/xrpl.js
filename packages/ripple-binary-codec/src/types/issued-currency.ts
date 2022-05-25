import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { Currency } from './currency'
import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'

/**
 * Interface for JSON objects that represent amounts
 */
interface IssuedCurrencyObject extends JsonObject {
  currency: string
  issuer: string
}

/**
 * Type guard for AmountObject
 */
function isIssuedCurrencyObject(arg): arg is IssuedCurrencyObject {
  const keys = Object.keys(arg).sort()
  return keys.length === 2 && keys[0] === 'currency' && keys[1] === 'issuer'
}

/**
 * Class for serializing/Deserializing Amounts
 */
class IssuedCurrency extends SerializedType {
  static readonly ZERO_ISSUED_CURRENCY: IssuedCurrency = new IssuedCurrency(
    Buffer.alloc(20),
  )

  constructor(bytes: Buffer) {
    super(bytes ?? IssuedCurrency.ZERO_ISSUED_CURRENCY.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, or a string
   *     representing an integer amount
   * @returns An Amount object
   */
  static from<T extends IssuedCurrency | IssuedCurrencyObject | string>(
    value: T,
  ): IssuedCurrency {
    if (value instanceof IssuedCurrency) {
      return value
    }

    if (typeof value === 'string') {
      IssuedCurrency.assertXrpIsValid(value)

      const currency = Currency.from(value).toBytes()

      return new IssuedCurrency(currency)
    }

    if (isIssuedCurrencyObject(value)) {
      const currency = Currency.from(value.currency).toBytes()
      const issuer = AccountID.from(value.issuer).toBytes()
      return new IssuedCurrency(Buffer.concat([currency, issuer]))
    }

    throw new Error('Invalid type to construct an Amount')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @returns An Amount object
   */
  static fromParser(parser: BinaryParser): IssuedCurrency {
    const currency = parser.read(20)
    if (new Currency(currency).toJSON() === 'XRP') {
      return new IssuedCurrency(currency)
    }
    const currencyAndIssuer = [currency, parser.read(20)]
    return new IssuedCurrency(Buffer.concat(currencyAndIssuer))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): IssuedCurrencyObject | string {
    const parser = new BinaryParser(this.toString())
    const currency = Currency.fromParser(parser) as Currency
    if (currency.toJSON() === 'XRP') {
      return currency.toJSON()
    }
    const issuer = AccountID.fromParser(parser) as AccountID

    return {
      currency: currency.toJSON(),
      issuer: issuer.toJSON(),
    }
  }

  /**
   * Validate XRP amount
   *
   * @param value String representing XRP amount
   * @returns void, but will throw if invalid amount
   */
  private static assertXrpIsValid(value: string): void {
    if (value !== 'XRP') {
      throw new Error(`${value} is an illegal amount`)
    }
  }
}

export { IssuedCurrency, IssuedCurrencyObject }
