import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import { Buffer } from 'buffer/'

/**
 * Derived UInt class for serializing/deserializing 8 bit UInt
 */
class UInt8 extends UInt {
  protected static readonly width: number = 8 / 8 // 1
  static readonly defaultUInt8: UInt8 = new UInt8(Buffer.alloc(UInt8.width))

  constructor(bytes: Buffer) {
    super(bytes ?? UInt8.defaultUInt8.bytes)
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt8(parser.read(UInt8.width))
  }

  /**
   * Construct a UInt8 object from a number
   *
   * @param val UInt8 object or number
   */
  static from<T extends UInt8 | number>(val: T): UInt8 {
    if (val instanceof UInt8) {
      return val
    }

    if (typeof val === 'number') {
      const buf = Buffer.alloc(UInt8.width)
      buf.writeUInt8(val, 0)
      return new UInt8(buf)
    }

    throw new Error('Cannot construct UInt8 from given value')
  }

  /**
   * get the value of a UInt8 object
   *
   * @returns the number represented by this.bytes
   */
  valueOf(): number {
    return this.bytes.readUInt8(0)
  }
}

export { UInt8 }
