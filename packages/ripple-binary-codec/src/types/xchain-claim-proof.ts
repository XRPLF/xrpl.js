import { BinaryParser } from '../serdes/binary-parser'

import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { Sidechain, SidechainObject } from './sidechain'
import { Signature, SignatureObject } from './signature'
import { Amount } from './amount'
import { UInt8 } from './uint-8'
import { UInt32 } from './uint-32'

/**
 * Constants for separating Paths in a PathSet
 */
const ARRAY_END_BYTE = 0xf1

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
      Amount.defaultAmount.toBytes(),
      Sidechain.ZERO_SIDECHAIN.toBytes(),
      Buffer.from([ARRAY_END_BYTE]),
      UInt8.defaultUInt8.toBytes(),
      UInt32.defaultUInt32.toBytes(),
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
      const amount = Amount.from(value.amount).toBytes()
      const sidechain = Sidechain.from(value.sidechain).toBytes()
      const signatures: Array<Buffer> = []
      value.signatures.forEach((signature: SignatureObject) => {
        signatures.push(Signature.from(signature).toBytes())
      })
      signatures.push(Buffer.from([ARRAY_END_BYTE]))
      const was_src_chain_send = UInt8.from(
        Number(value.was_src_chain_send),
      ).toBytes()
      const xchain_seq = UInt32.from(value.xchain_seq).toBytes()
      return new XChainClaimProof(
        Buffer.concat([
          amount,
          sidechain,
          ...signatures,
          was_src_chain_send,
          xchain_seq,
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

    bytes.push(Amount.fromParser(parser).toBytes())
    bytes.push(Sidechain.fromParser(parser).toBytes())
    while (!parser.end()) {
      bytes.push(Signature.fromParser(parser).toBytes())

      if (parser.peek() === ARRAY_END_BYTE) {
        bytes.push(parser.read(1))
        break
      }
    }
    bytes.push(parser.read(UInt8.width))
    bytes.push(parser.read(UInt32.width))

    return new XChainClaimProof(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): XChainClaimProofObject {
    const parser = new BinaryParser(this.toString())
    const amount = Amount.fromParser(parser).toJSON()
    const sidechain = Sidechain.fromParser(parser).toJSON()
    const signatures: SignatureObject[] = []
    while (!parser.end()) {
      if (parser.peek() === ARRAY_END_BYTE) {
        parser.skip(1)
        break
      }

      signatures.push(Signature.fromParser(parser).toJSON())
    }
    const was_src_chain_send = UInt8.fromParser(parser).toJSON()

    const xchain_seq = UInt32.fromParser(parser).toJSON()

    return {
      amount: amount as string,
      sidechain,
      signatures,
      was_src_chain_send: Boolean(was_src_chain_send),
      xchain_seq: xchain_seq as number,
    }
  }
}

export { XChainClaimProof, XChainClaimProofObject }
