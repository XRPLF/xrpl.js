import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { Issue, IssueObject } from './issue'

/**
 * Interface for JSON objects that represent cross-chain bridges
 */
interface XChainBridgeObject extends JsonObject {
  LockingChainDoor: string
  LockingChainIssue: IssueObject | string
  IssuingChainDoor: string
  IssuingChainIssue: IssueObject | string
}

/**
 * Type guard for XChainBridgeObject
 */
function isXChainBridgeObject(arg): arg is XChainBridgeObject {
  const keys = Object.keys(arg).sort()
  return (
    keys.length === 4 &&
    keys[0] === 'IssuingChainDoor' &&
    keys[1] === 'IssuingChainIssue' &&
    keys[2] === 'LockingChainDoor' &&
    keys[3] === 'LockingChainIssue'
  )
}

/**
 * Class for serializing/deserializing XChainBridges
 */
class XChainBridge extends SerializedType {
  static readonly ZERO_XCHAIN_BRIDGE: XChainBridge = new XChainBridge(
    Buffer.concat([
      Buffer.from([0x14]),
      Buffer.alloc(40),
      Buffer.from([0x14]),
      Buffer.alloc(40),
    ]),
  )

  static readonly TYPE_ORDER: { name: string; type: typeof SerializedType }[] =
    [
      { name: 'LockingChainDoor', type: AccountID },
      { name: 'LockingChainIssue', type: Issue },
      { name: 'IssuingChainDoor', type: AccountID },
      { name: 'IssuingChainIssue', type: Issue },
    ]

  constructor(bytes: Buffer) {
    super(bytes ?? XChainBridge.ZERO_XCHAIN_BRIDGE.bytes)
  }

  /**
   * Construct a cross-chain bridge from a JSON
   *
   * @param value XChainBridge or JSON to parse into an XChainBridge
   * @returns An XChainBridge object
   */
  static from<T extends XChainBridge | XChainBridgeObject>(
    value: T,
  ): XChainBridge {
    if (value instanceof XChainBridge) {
      return value
    }

    if (!isXChainBridgeObject(value)) {
      throw new Error('Invalid type to construct an XChainBridge')
    }

    const bytes: Array<Buffer> = []
    this.TYPE_ORDER.forEach((item) => {
      const { name, type } = item
      if (type === AccountID) {
        bytes.push(Buffer.from([0x14]))
      }
      const object = type.from(value[name])
      bytes.push(object.toBytes())
    })
    return new XChainBridge(Buffer.concat(bytes))
  }

  /**
   * Read an XChainBridge from a BinaryParser
   *
   * @param parser BinaryParser to read the XChainBridge from
   * @returns An XChainBridge object
   */
  static fromParser(parser: BinaryParser): XChainBridge {
    const bytes: Array<Buffer> = []

    this.TYPE_ORDER.forEach((item) => {
      const { type } = item
      if (type === AccountID) {
        parser.skip(1)
        bytes.push(Buffer.from([0x14]))
      }
      const object = type.fromParser(parser)
      bytes.push(object.toBytes())
    })

    return new XChainBridge(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this XChainBridge
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): XChainBridgeObject {
    const parser = new BinaryParser(this.toString())
    const json = {}
    XChainBridge.TYPE_ORDER.forEach((item) => {
      const { name, type } = item
      if (type === AccountID) {
        parser.skip(1)
      }
      const object = type.fromParser(parser).toJSON()
      json[name] = object
    })
    return json as XChainBridgeObject
  }
}

export { XChainBridge, XChainBridgeObject }
