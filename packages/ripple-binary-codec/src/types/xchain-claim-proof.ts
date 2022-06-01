import { BinaryParser } from '../serdes/binary-parser'

import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { Sidechain, SidechainObject } from './sidechain'
import { Amount } from './amount'
import { UInt8 } from './uint-8'
import { UInt32 } from './uint-32'
import { STArray } from './st-array'

/**
 * Interface for JSON objects that represent signatures
 */
interface SignatureObject extends JsonObject {
  XChainProofSig: {
    Signature: string
    PublicKey: string
  }
}

/**
 * Interface for JSON objects that represent XChainClaimProofs
 */
interface XChainClaimProofObject extends JsonObject {
  amount: string
  sidechain: SidechainObject
  signatures: SignatureObject[]
  was_src_chain_send: boolean
  xchain_seq: number
}

/**
 * Type guard for XChainClaimProofObject
 */
function isProofObject(arg): arg is XChainClaimProofObject {
  const keys = Object.keys(arg).sort()
  return (
    keys.length === 5 &&
    keys[0] === 'amount' &&
    keys[1] === 'sidechain' &&
    keys[2] === 'signatures' &&
    keys[3] === 'was_src_chain_send' &&
    keys[4] === 'xchain_seq'
  )
}

/**
 * Class for serializing/Deserializing XChainClaimProofs
 */
class XChainClaimProof extends SerializedType {
  static readonly ZERO_PROOF: XChainClaimProof = new XChainClaimProof(
    Buffer.concat([
      Sidechain.ZERO_SIDECHAIN.toBytes(),
      Amount.defaultAmount.toBytes(),
      UInt32.defaultUInt32.toBytes(),
      UInt8.defaultUInt8.toBytes(),
    ]),
  )

  static readonly TYPE_ORDER: { name: string; type: typeof SerializedType }[] =
    [
      { name: 'sidechain', type: Sidechain },
      { name: 'amount', type: Amount },
      { name: 'xchain_seq', type: UInt32 },
      { name: 'was_src_chain_send', type: UInt8 },
      { name: 'signatures', type: STArray },
    ]

  constructor(bytes: Buffer) {
    super(bytes ?? XChainClaimProof.ZERO_PROOF.bytes)
  }

  /**
   * Construct a XChainClaimProof from a JSON
   *
   * @param value XChainClaimProof or JSON to parse into an XChainClaimProof
   * @returns A XChainClaimProof object
   */
  static from<T extends XChainClaimProof | XChainClaimProofObject>(
    value: T,
  ): XChainClaimProof {
    if (value instanceof XChainClaimProof) {
      return value
    }

    if (isProofObject(value)) {
      const bytes: Array<Buffer> = []
      this.TYPE_ORDER.forEach((item) => {
        const { name, type } = item
        const object = type.from(value[name])
        bytes.push(object.toBytes())
      })

      return new XChainClaimProof(Buffer.concat(bytes))
    }

    throw new Error('Invalid type to construct a XChainClaimProof')
  }

  /**
   * Read a XChainClaimProof from a BinaryParser
   *
   * @param parser BinaryParser to read the XChainClaimProof from
   * @returns A XChainClaimProof object
   */
  static fromParser(parser: BinaryParser): XChainClaimProof {
    const bytes: Array<Buffer> = []

    this.TYPE_ORDER.forEach((item) => {
      const { type } = item
      const object = type.fromParser(parser)
      bytes.push(object.toBytes())
    })

    return new XChainClaimProof(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this XChainClaimProof
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): XChainClaimProofObject {
    const parser = new BinaryParser(this.toString())
    const json = {}
    XChainClaimProof.TYPE_ORDER.forEach((item) => {
      const { name, type } = item
      const object = type.fromParser(parser).toJSON()
      json[name] = object
    })
    json['was_src_chain_send'] = Boolean(json['was_src_chain_send'])
    return json as XChainClaimProofObject
  }
}

export { XChainClaimProof, XChainClaimProofObject }
