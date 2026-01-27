import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import { readInt32BE, writeInt32BE } from '../utils'

/**
 * Derived Int class for serializing/deserializing 32 bit Int
 */
class Int32 extends UInt {
  protected static readonly width: number = 32 / 8 // 4
  static readonly defaultInt32: Int32 = new Int32(new Uint8Array(Int32.width))

  constructor(bytes: Uint8Array) {
    super(bytes ?? Int32.defaultInt32.bytes)
  }

  static fromParser(parser: BinaryParser): UInt {
    return new Int32(parser.read(Int32.width))
  }

  /**
   * Construct a Int32 object from a number
   *
   * @param val Int32 object or number
   */
  static from<T extends Int32 | number | string>(val: T): Int32 {
    if (val instanceof Int32) {
      return val
    }

    const buf = new Uint8Array(Int32.width)

    if (typeof val === 'string') {
      const num = Number.parseInt(val)
      writeInt32BE(buf, num, 0)
      return new Int32(buf)
    }

    if (typeof val === 'number') {
      Int32.checkUintRange(val, -2147483648, 2147483647)
      writeInt32BE(buf, val, 0)
      return new Int32(buf)
    }

    throw new Error('Cannot construct Int32 from given value')
  }

  /**
   * get the value of a Int32 object
   *
   * @returns the number represented by this.bytes
   */
  valueOf(): number {
    return readInt32BE(this.bytes, 0)
  }
}

export { Int32 }
