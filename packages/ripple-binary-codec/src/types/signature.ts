import { BinaryParser } from '../serdes/binary-parser'

import { JsonObject, SerializedType } from './serialized-type'
import { Buffer } from 'buffer/'
import { Blob } from './blob'
import { decodeAccountPublic, encodeAccountPublic } from 'ripple-address-codec'

/**
 * Interface for JSON objects that represent amounts
 */
interface SignatureObject extends JsonObject {
  signature: string
  signing_key: string
}

/**
 * Type guard for AmountObject
 */
function isSignatureObject(arg): arg is SignatureObject {
  const keys = Object.keys(arg).sort()
  return (
    keys.length === 2 && keys[0] === 'signature' && keys[1] === 'signing_key'
  )
}

function encodeVariableLength(length: number): Buffer {
  const lenBytes = Buffer.alloc(3)
  if (length <= 192) {
    lenBytes[0] = length
    return lenBytes.slice(0, 1)
  } else if (length <= 12480) {
    length -= 193
    lenBytes[0] = 193 + (length >>> 8)
    lenBytes[1] = length & 0xff
    return lenBytes.slice(0, 2)
  } else if (length <= 918744) {
    length -= 12481
    lenBytes[0] = 241 + (length >>> 16)
    lenBytes[1] = (length >> 8) & 0xff
    lenBytes[2] = length & 0xff
    return lenBytes.slice(0, 3)
  }
  throw new Error('Overflow error')
}

/**
 * Class for serializing/Deserializing Amounts
 */
class Signature extends SerializedType {
  static readonly ZERO_SIGNATURE: Signature = new Signature(
    Buffer.concat([Buffer.alloc(1), Buffer.from([33]), Buffer.alloc(33)]),
  )

  constructor(bytes: Buffer) {
    super(bytes ?? Signature.ZERO_SIGNATURE.bytes)
  }

  /**
   * Construct an amount from an IOU or string amount
   *
   * @param value An Amount, object representing an IOU, or a string
   *     representing an integer amount
   * @returns An Amount object
   */
  static from<T extends Signature | SignatureObject>(value: T): Signature {
    if (value instanceof Signature) {
      return value
    }

    if (isSignatureObject(value)) {
      const signature = Blob.from(value.signature).toBytes()
      const signing_key = new Blob(
        Buffer.from(decodeAccountPublic(value.signing_key)),
      ).toBytes()
      return new Signature(
        Buffer.concat([
          encodeVariableLength(signature.length),
          signature,
          encodeVariableLength(signing_key.length),
          signing_key,
        ]),
      )
    }

    throw new Error('Invalid type to construct a Signature')
  }

  /**
   * Read an amount from a BinaryParser
   *
   * @param parser BinaryParser to read the Amount from
   * @returns An Amount object
   */
  static fromParser(parser: BinaryParser): Signature {
    const bytes: Array<Buffer> = []

    const signatureLength = parser.readVariableLengthLength()
    bytes.push(encodeVariableLength(signatureLength))
    bytes.push(Blob.fromParser(parser, signatureLength).toBytes())
    const signingKeyLength = parser.readVariableLengthLength()
    bytes.push(encodeVariableLength(signingKeyLength))
    bytes.push(Blob.fromParser(parser, signingKeyLength).toBytes())

    return new Signature(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Amount
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): SignatureObject {
    const parser = new BinaryParser(this.toString())
    const signatureLength = parser.readVariableLengthLength()
    const signature = Blob.fromParser(
      parser,
      signatureLength,
    ).toJSON() as string
    const signingKeyLength = parser.readVariableLengthLength()
    const signingKey = Blob.fromParser(parser, signingKeyLength)

    return {
      signature,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      signing_key: encodeAccountPublic(signingKey.toBytes()),
    }
  }
}

export { Signature, SignatureObject }
