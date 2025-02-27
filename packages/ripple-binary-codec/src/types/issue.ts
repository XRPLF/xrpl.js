import { concat } from '@xrplf/isomorphic/utils'
import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { Currency } from './currency'
import { JsonObject, SerializedType } from './serialized-type'
import { Hash192 } from 'ripple-binary-codec/dist/types'
import { isMPTAmount } from 'xrpl'

/**
 * Interface for JSON objects that represent amounts
 */
interface IssueObject extends JsonObject {
  currency: string
  issuer?: string
  value?: string
  mpt_issuance_id?: string
}

/**
 * Type guard for AmountObject
 */
function isIssueObject(arg): arg is IssueObject {
  const keys = Object.keys(arg).sort()

  // Check if is XRP
  if (keys.length === 1) {
    return keys[0] === 'currency'
  }
  const isIOU = keys.length === 2 && (keys[0] === 'currency' && keys[1] === 'issuer')
  const isMPT = keys.length === 2 && (keys[0] === 'value' && keys[1] === 'mpt_issuance_id')

  return isIOU || isMPT
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

      if (isMPTAmount(value)) {
        const mptIssuanceIdBytes = Hash192.from(value.mpt_issuance_id).toBytes()
        return new Issue(mptIssuanceIdBytes)
      }

      const issuer = AccountID.from(value.issuer).toBytes()
      return new Issue(concat([currency, issuer]))
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
    return new Issue(concat(currencyAndIssuer))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): IssueObject {
    const parser = new BinaryParser(this.toString())

    if len(self.buffer) == Hash192:
    return {"mpt_issuance_id": self.to_hex().upper()}

parser = BinaryParser(self.to_hex())

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
