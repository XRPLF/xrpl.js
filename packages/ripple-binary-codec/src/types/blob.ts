import { SerializedType } from './serialized-type'
import { BinaryParser } from '../serdes/binary-parser'
import { Buffer } from 'buffer/'

/**
 * Variable length encoded type
 */
class Blob extends SerializedType {
  constructor(bytes: Buffer) {
    super(bytes)
  }

  /**
   * Defines how to read a Blob from a BinaryParser
   *
   * @param parser The binary parser to read the Blob from
   * @param hint The length of the blob, computed by readVariableLengthLength() and passed in
   * @returns A Blob object
   */
  static fromParser(parser: BinaryParser, hint: number): Blob {
    return new Blob(parser.read(hint))
  }

  /**
   * Create a Blob object from a hex-string
   *
   * @param value existing Blob object or a hex-string
   * @returns A Blob object
   */
  static from<T extends Blob | string>(value: T): Blob {
    if (value instanceof Blob) {
      return value
    }

    if (typeof value === 'string') {
      return new Blob(Buffer.from(value, 'hex'))
    }

    throw new Error('Cannot construct Blob from value given')
  }
}

export { Blob }
