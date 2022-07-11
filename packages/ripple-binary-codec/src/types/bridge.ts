import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { IssuedCurrency, IssuedCurrencyObject } from './issued-currency'

/**
 * Interface for JSON objects that represent bridges
 */
interface BridgeObject extends JsonObject {
  dst_chain_door: string
  dst_chain_issue: IssuedCurrencyObject | string
  src_chain_door: string
  src_chain_issue: IssuedCurrencyObject | string
}

/**
 * Type guard for BridgeObject
 */
function isBridgeObject(arg): arg is BridgeObject {
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
 * Class for serializing/deserializing Bridges
 */
class Bridge extends SerializedType {
  static readonly ZERO_Bridge: Bridge = new Bridge(Buffer.alloc(80))

  static readonly TYPE_ORDER: { name: string; type: typeof SerializedType }[] =
    [
      { name: 'src_chain_door', type: AccountID },
      { name: 'src_chain_issue', type: IssuedCurrency },
      { name: 'dst_chain_door', type: AccountID },
      { name: 'dst_chain_issue', type: IssuedCurrency },
    ]

  constructor(bytes: Buffer) {
    super(bytes ?? Bridge.ZERO_Bridge.bytes)
  }

  /**
   * Construct a bridge from a JSON
   *
   * @param value Bridge or JSON to parse into a Bridge
   * @returns A Bridge object
   */
  static from<T extends Bridge | BridgeObject>(value: T): Bridge {
    if (value instanceof Bridge) {
      return value
    }

    if (isBridgeObject(value)) {
      const bytes: Array<Buffer> = []
      this.TYPE_ORDER.forEach((item) => {
        const { name, type } = item
        const object = type.from(value[name])
        bytes.push(object.toBytes())
      })
      return new Bridge(Buffer.concat(bytes))
    }

    throw new Error('Invalid type to construct a Bridge')
  }

  /**
   * Read a Bridge from a BinaryParser
   *
   * @param parser BinaryParser to read the Bridge from
   * @returns A Bridge object
   */
  static fromParser(parser: BinaryParser): Bridge {
    const bytes: Array<Buffer> = []

    this.TYPE_ORDER.forEach((item) => {
      const { type } = item
      const object = type.fromParser(parser)
      bytes.push(object.toBytes())
    })

    return new Bridge(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Bridge
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): BridgeObject {
    const parser = new BinaryParser(this.toString())
    const json = {}
    Bridge.TYPE_ORDER.forEach((item) => {
      const { name, type } = item
      const object = type.fromParser(parser).toJSON()
      json[name] = object
    })
    return json as BridgeObject
  }
}

export { Bridge, BridgeObject }
