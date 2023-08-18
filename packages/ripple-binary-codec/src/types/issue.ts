import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { Currency } from './currency'
import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'

/**
 * Interface for JSON objects that represent amounts
 */
interface IssueObject extends JsonObject {
  currency: string
  issuer?: string
}

/**
 * Type guard for AmountObject
 */
function isIssueObject(arg): arg is IssueObject {
  const keys = Object.keys(arg).sort()
  if (keys.length === 1) {
    return keys[0] === 'currency'
  }
  return keys.length === 2 && keys[0] === 'currency' && keys[1] === 'issuer'
}

/**
 * Class for serializing/Deserializing Amounts
 */
class Issue extends SerializedType {
  static readonly ZERO_ISSUED_CURRENCY: Issue = new Issue(Buffer.alloc(20))

  constructor(bytes: Buffer) {
    super(bytes ?? Issue.ZERO_ISSUED_CURRENCY.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, or a string
   *     representing an integer amount
   * @returns An Amount object
   */
  static from<T extends Issue | IssueObject>(value: T): Issue {
    if (value instanceof Issue) {
      return value
    }

    if (isIssueObject(value)) {
      const currency = Currency.from(value.currency).toBytes()
      if (value.issuer == null) {
        return new Issue(currency)
      }
      const issuer = AccountID.from(value.issuer).toBytes()
      return new Issue(Buffer.concat([currency, issuer]))
    }

    throw new Error('Invalid type to construct an Amount')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @returns An Amount object
   */
  static fromParser(parser: BinaryParser): Issue {
    const currency = parser.read(20)
    if (new Currency(currency).toJSON() === 'XRP') {
      return new Issue(currency)
    }
    const currencyAndIssuer = [currency, parser.read(20)]
    return new Issue(Buffer.concat(currencyAndIssuer))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): IssueObject {
    const parser = new BinaryParser(this.toString())
    const currency = Currency.fromParser(parser) as Currency
    if (currency.toJSON() === 'XRP') {
      return { currency: currency.toJSON() }
    }
    const issuer = AccountID.fromParser(parser) as AccountID

    return {
      currency: currency.toJSON(),
      issuer: issuer.toJSON(),
    }
  }
}

export { Issue, IssueObject }
