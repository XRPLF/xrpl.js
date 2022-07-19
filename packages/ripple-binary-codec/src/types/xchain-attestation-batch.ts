import { BinaryParser } from '../serdes/binary-parser'

import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { XChainBridge, XChainBridgeObject } from './xchain-bridge'
import { STArray } from './st-array'

/**
 * Interface for JSON objects that represent cross-chain attestations
 */
interface XChainAttestationBatchObject extends JsonObject {
  XChainBridge: XChainBridgeObject
  XChainClaimAttestationBatch: JsonObject[]
  XChainCreateAccountAttestationBatch: JsonObject[]
}

/**
 * Type guard for XChainAttestationBatchObject
 */
function isXChainAttestationBatchObject(
  arg,
): arg is XChainAttestationBatchObject {
  const keys = Object.keys(arg).sort()
  return (
    keys.length === 3 &&
    keys[0] === 'XChainBridge' &&
    keys[1] === 'XChainClaimAttestationBatch' &&
    keys[2] === 'XChainCreateAccountAttestationBatch'
  )
}

/**
 * Class for serializing/deserializing XChainAttestationBatchs
 */
class XChainAttestationBatch extends SerializedType {
  static readonly ZERO_XCHAIN_ATTESTATION_BATCH: XChainAttestationBatch =
    new XChainAttestationBatch(
      Buffer.concat([
        Buffer.from([0x14]),
        Buffer.alloc(40),
        Buffer.from([0x14]),
        Buffer.alloc(40),
      ]),
    )

  static readonly TYPE_ORDER: { name: string; type: typeof SerializedType }[] =
    [
      { name: 'XChainBridge', type: XChainBridge },
      { name: 'XChainClaimAttestationBatch', type: STArray },
      { name: 'XChainCreateAccountAttestationBatch', type: STArray },
    ]

  constructor(bytes: Buffer) {
    super(bytes ?? XChainAttestationBatch.ZERO_XCHAIN_ATTESTATION_BATCH.bytes)
  }

  /**
   * Construct a cross-chain bridge from a JSON
   *
   * @param value XChainAttestationBatch or JSON to parse into a XChainAttestationBatch
   * @returns A XChainAttestationBatch object
   */
  static from<T extends XChainAttestationBatch | XChainAttestationBatchObject>(
    value: T,
  ): XChainAttestationBatch {
    if (value instanceof XChainAttestationBatch) {
      return value
    }

    if (isXChainAttestationBatchObject(value)) {
      const bytes: Array<Buffer> = []
      this.TYPE_ORDER.forEach((item) => {
        const { name, type } = item
        const object = type.from(value[name])
        bytes.push(object.toBytes())
      })
      return new XChainAttestationBatch(Buffer.concat(bytes))
    }

    throw new Error('Invalid type to construct a XChainAttestationBatch')
  }

  /**
   * Read a XChainAttestationBatch from a BinaryParser
   *
   * @param parser BinaryParser to read the XChainAttestationBatch from
   * @returns A XChainAttestationBatch object
   */
  static fromParser(parser: BinaryParser): XChainAttestationBatch {
    const bytes: Array<Buffer> = []

    this.TYPE_ORDER.forEach((item) => {
      const { type } = item
      const object = type.fromParser(parser)
      bytes.push(object.toBytes())
    })

    return new XChainAttestationBatch(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this XChainAttestationBatch
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): XChainAttestationBatchObject {
    const parser = new BinaryParser(this.toString())
    const json = {}
    XChainAttestationBatch.TYPE_ORDER.forEach((item) => {
      const { name, type } = item
      const object = type.fromParser(parser).toJSON()
      json[name] = object
    })
    return json as XChainAttestationBatchObject
  }
}

export { XChainAttestationBatch, XChainAttestationBatchObject }
