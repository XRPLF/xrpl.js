import { concat } from '@xrplf/isomorphic/utils'
import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { Currency } from './currency'
import { JsonObject, SerializedType } from './serialized-type'
import { Hash192 } from './hash-192'

interface XRPIssue extends JsonObject {
  currency: string
}

interface IOUIssue extends JsonObject {
  currency: string
  issuer: string
}
interface MPTIssue extends JsonObject {
  mpt_issuance_id: string
}
/**
 * Interface for JSON objects that represent issues
 */
type IssueObject = XRPIssue | IOUIssue | MPTIssue

/**
 * Type guard for Issue Object
 */
function isIssueObject(arg): arg is IssueObject {
  const keys = Object.keys(arg).sort()
  const isXRP = keys.length === 1 && keys[0] === 'currency'
  const isIOU =
    keys.length === 2 && keys[0] === 'currency' && keys[1] === 'issuer'
  const isMPT = keys.length === 1 && keys[0] === 'mpt_issuance_id'

  return isXRP || isIOU || isMPT
}

/**
 * Class for serializing/Deserializing Amounts
 */
class Issue extends SerializedType {
  static readonly ZERO_ISSUED_CURRENCY: Issue = new Issue(new Uint8Array(20))

  constructor(bytes: Uint8Array) {
    super(bytes ?? Issue.ZERO_ISSUED_CURRENCY.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, MPTAmount, or a string
   *     representing an integer amount
   * @returns An Issue object
   */
  static from<T extends Issue | IssueObject>(value: T): Issue {
    if (value instanceof Issue) {
      return value
    }

    if (isIssueObject(value)) {
      if (value.currency) {
        const currency = Currency.from(value.currency.toString()).toBytes()

        //IOU case
        if (value.issuer) {
          const issuer = AccountID.from(value.issuer.toString()).toBytes()
          return new Issue(concat([currency, issuer]))
        }

        //XRP case
        return new Issue(currency)
      }

      // MPT case
      if (value.mpt_issuance_id) {
        const mptIssuanceIdBytes = Hash192.from(
          value.mpt_issuance_id.toString(),
        ).toBytes()
        return new Issue(mptIssuanceIdBytes)
      }
    }

    throw new Error('Invalid type to construct an Amount')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @param hint The number of bytes to consume from the parser.
   * For an MPT amount, pass 24 (the fixed length for Hash192).
   *
   * @returns An Issue object
   */
  static fromParser(parser: BinaryParser, hint?: number): Issue {
    if (hint === Hash192.width) {
      const mptBytes = parser.read(Hash192.width)
      return new Issue(mptBytes)
    }
    const currency = parser.read(20)
    if (new Currency(currency).toJSON() === 'XRP') {
      return new Issue(currency)
    }
    const currencyAndIssuer = [currency, parser.read(20)]
    return new Issue(concat(currencyAndIssuer))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): IssueObject {
    // If the buffer is exactly 24 bytes, treat it as an MPT amount.
    if (this.toBytes().length === Hash192.width) {
      return {
        mpt_issuance_id: this.toHex().toUpperCase(),
      }
    }

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
