import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { IssuedCurrency, IssuedCurrencyObject } from './issued-currency'

/**
 * Interface for JSON objects that represent amounts
 */
interface SidechainObject extends JsonObject {
  dst_chain_door: string
  dst_chain_issue: IssuedCurrencyObject | string
  src_chain_door: string
  src_chain_issue: IssuedCurrencyObject | string
}

/**
 * Type guard for AmountObject
 */
function isSidechainObject(arg): arg is SidechainObject {
  const keys = Object.keys(arg).sort()
  return (
    keys.length === 4 &&
    keys[0] === 'dst_chain_door' &&
    keys[1] === 'dst_chain_issue' &&
    keys[2] === 'src_chain_door' &&
    keys[3] === 'src_chain_issue'
  )
}

/**
 * Class for serializing/Deserializing Amounts
 */
class Sidechain extends SerializedType {
  static readonly ZERO_SIDECHAIN: Sidechain = new Sidechain(Buffer.alloc(80))

  constructor(bytes: Buffer) {
    super(bytes ?? Sidechain.ZERO_SIDECHAIN.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, or a string
   *     representing an integer amount
   * @returns An Amount object
   */
  static from<T extends Sidechain | SidechainObject>(value: T): Sidechain {
    if (value instanceof Sidechain) {
      return value
    }

    if (isSidechainObject(value)) {
      const dst_chain_door = AccountID.from(value.dst_chain_door).toBytes()
      const dst_chain_issue = IssuedCurrency.from(
        value.dst_chain_issue,
      ).toBytes()
      const src_chain_door = AccountID.from(value.src_chain_door).toBytes()
      const src_chain_issue = IssuedCurrency.from(
        value.src_chain_issue,
      ).toBytes()
      return new Sidechain(
        Buffer.concat([
          dst_chain_door,
          dst_chain_issue,
          src_chain_door,
          src_chain_issue,
        ]),
      )
    }

    throw new Error('Invalid type to construct a Sidechain')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @returns An Amount object
   */
  static fromParser(parser: BinaryParser): Sidechain {
    const bytes: Array<Buffer> = []

    bytes.push(parser.read(AccountID.width))
    bytes.push(IssuedCurrency.fromParser(parser).toBytes())
    bytes.push(parser.read(AccountID.width))
    bytes.push(IssuedCurrency.fromParser(parser).toBytes())

    return new Sidechain(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): SidechainObject {
    const parser = new BinaryParser(this.toString())
    const dst_chain_door = AccountID.fromParser(parser) as AccountID
    const dst_chain_issue = IssuedCurrency.fromParser(parser)
    const src_chain_door = AccountID.fromParser(parser) as AccountID
    const src_chain_issue = IssuedCurrency.fromParser(parser)

    return {
      dst_chain_door: dst_chain_door.toJSON(),
      dst_chain_issue: dst_chain_issue.toJSON(),
      src_chain_door: src_chain_door.toJSON(),
      src_chain_issue: src_chain_issue.toJSON(),
    }
  }
}

export { Sidechain, SidechainObject }
