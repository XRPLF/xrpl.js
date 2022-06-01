import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { IssuedCurrency, IssuedCurrencyObject } from './issued-currency'

/**
 * Interface for JSON objects that represent sidechains
 */
interface SidechainObject extends JsonObject {
  dst_chain_door: string
  dst_chain_issue: IssuedCurrencyObject | string
  src_chain_door: string
  src_chain_issue: IssuedCurrencyObject | string
}

/**
 * Type guard for SidechainObject
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
 * Class for serializing/deserializing Sidechains
 */
class Sidechain extends SerializedType {
  static readonly ZERO_SIDECHAIN: Sidechain = new Sidechain(Buffer.alloc(80))

  static readonly TYPE_ORDER: { name: string; type: typeof SerializedType }[] =
    [
      { name: 'src_chain_door', type: AccountID },
      { name: 'src_chain_issue', type: IssuedCurrency },
      { name: 'dst_chain_door', type: AccountID },
      { name: 'dst_chain_issue', type: IssuedCurrency },
    ]

  constructor(bytes: Buffer) {
    super(bytes ?? Sidechain.ZERO_SIDECHAIN.bytes)
  }

  /**
   * Construct a sidechain from a JSON
   *
   * @param value Sidechain or JSON to parse into a Sidechain
   * @returns A Sidechain object
   */
  static from<T extends Sidechain | SidechainObject>(value: T): Sidechain {
    if (value instanceof Sidechain) {
      return value
    }

    if (isSidechainObject(value)) {
      const bytes: Array<Buffer> = []
      this.TYPE_ORDER.forEach((item) => {
        const { name, type } = item
        const object = type.from(value[name])
        bytes.push(object.toBytes())
      })
      return new Sidechain(Buffer.concat(bytes))
    }

    throw new Error('Invalid type to construct a Sidechain')
  }

  /**
   * Read a Sidechain from a BinaryParser
   *
   * @param parser BinaryParser to read the Sidechain from
   * @returns A Sidechain object
   */
  static fromParser(parser: BinaryParser): Sidechain {
    const bytes: Array<Buffer> = []

    this.TYPE_ORDER.forEach((item) => {
      const { type } = item
      const object = type.fromParser(parser)
      bytes.push(object.toBytes())
    })

    return new Sidechain(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Sidechain
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): SidechainObject {
    const parser = new BinaryParser(this.toString())
    const json = {}
    Sidechain.TYPE_ORDER.forEach((item) => {
      const { name, type } = item
      const object = type.fromParser(parser).toJSON()
      json[name] = object
    })
    return json as SidechainObject
  }
}

export { Sidechain, SidechainObject }
