import { BinaryParser } from '../serdes/binary-parser'

import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { Sidechain, SidechainObject } from './sidechain'
import { Amount } from './amount'
import { UInt8 } from './uint-8'
import { UInt32 } from './uint-32'
import { STArray } from './st-array'

/**
 * Interface for JSON objects that represent amounts
 */
interface SignatureObject extends JsonObject {
  signature: string
  signing_key: string
}

/**
 * Interface for JSON objects that represent amounts
 */
interface XChainClaimProofObject extends JsonObject {
  amount: string
  sidechain: SidechainObject
  signatures: SignatureObject[]
  was_src_chain_send: boolean
  xchain_seq: number
}

/**
 * Type guard for AmountObject
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
 * Class for serializing/Deserializing Amounts
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

  constructor(bytes: Buffer) {
    super(bytes ?? XChainClaimProof.ZERO_PROOF.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, or a string
   *     representing an integer amount
   * @returns An Amount object
   */
  static from<T extends XChainClaimProof | XChainClaimProofObject>(
    value: T,
  ): XChainClaimProof {
    if (value instanceof XChainClaimProof) {
      return value
    }

    if (isProofObject(value)) {
      const sidechain = Sidechain.from(value.sidechain).toBytes()
      const amount = Amount.from(value.amount).toBytes()
      const xchain_seq = UInt32.from(value.xchain_seq).toBytes()
      const was_src_chain_send = UInt8.from(
        Number(value.was_src_chain_send),
      ).toBytes()
      const signatures = STArray.from(value.signatures).toBytes()
      return new XChainClaimProof(
        Buffer.concat([
          sidechain,
          amount,
          xchain_seq,
          was_src_chain_send,
          signatures,
        ]),
      )
    }

    throw new Error('Invalid type to construct a XChainClaimProof')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @returns An Amount object
   */
  static fromParser(parser: BinaryParser): XChainClaimProof {
    const bytes: Array<Buffer> = []

    bytes.push(Sidechain.fromParser(parser).toBytes())
    bytes.push(Amount.fromParser(parser).toBytes())
    bytes.push(parser.read(UInt32.width))
    bytes.push(parser.read(UInt8.width))
    bytes.push(STArray.fromParser(parser).toBytes())

    return new XChainClaimProof(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): XChainClaimProofObject {
    const parser = new BinaryParser(this.toString())
    const sidechain = Sidechain.fromParser(parser).toJSON()
    const amount = Amount.fromParser(parser).toJSON()
    const xchain_seq = UInt32.fromParser(parser).toJSON()
    const was_src_chain_send = UInt8.fromParser(parser).toJSON()
    const signatures = STArray.fromParser(parser).toJSON()

    return {
      amount: amount as string,
      sidechain,
      signatures: signatures as SignatureObject[],
      was_src_chain_send: Boolean(was_src_chain_send),
      xchain_seq: xchain_seq as number,
    }
  }
}

export { XChainClaimProof, XChainClaimProofObject }
