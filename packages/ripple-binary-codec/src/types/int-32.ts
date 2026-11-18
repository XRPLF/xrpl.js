import { Int } from './int'
import { BinaryParser } from '../serdes/binary-parser'
import { readInt32BE, writeInt32BE } from '../utils'

/**
 * Derived Int class for serializing/deserializing signed 32-bit integers.
 */
class Int32 extends Int {
  protected static readonly width: number = 32 / 8 // 4 bytes
  static readonly defaultInt32: Int32 = new Int32(new Uint8Array(Int32.width))

  // Signed 32-bit integer range
  static readonly MIN_VALUE: number = -2147483648 // -2^31
  static readonly MAX_VALUE: number = 2147483647 // 2^31 - 1

  constructor(bytes: Uint8Array) {
    super(bytes ?? Int32.defaultInt32.bytes)
  }

  /**
   * Construct an Int32 from a BinaryParser
   *
   * @param parser BinaryParser to read Int32 from
   * @returns An Int32 object
   */
  static fromParser(parser: BinaryParser): Int {
    return new Int32(parser.read(Int32.width))
  }

  /**
   * Construct an Int32 object from a number or string
   *
   * @param val Int32 object, number, or string
   * @returns An Int32 object
   */
  static from<T extends Int32 | number | string>(val: T): Int32 {
    if (val instanceof Int32) {
      return val
    }

    const buf = new Uint8Array(Int32.width)

    if (typeof val === 'string') {
      const num = Number(val)
      if (!Number.isFinite(num) || !Number.isInteger(num)) {
        throw new Error(`Cannot construct Int32 from string: ${val}`)
      }
      Int32.checkIntRange('Int32', num, Int32.MIN_VALUE, Int32.MAX_VALUE)
      writeInt32BE(buf, num, 0)
      return new Int32(buf)
    }

    if (typeof val === 'number' && Number.isInteger(val)) {
      Int32.checkIntRange('Int32', val, Int32.MIN_VALUE, Int32.MAX_VALUE)
      writeInt32BE(buf, val, 0)
      return new Int32(buf)
    }

    throw new Error('Cannot construct Int32 from given value')
  }

  /**
   * Get the value of the Int32 object
   *
   * @returns the signed 32-bit integer represented by this.bytes
   */
  valueOf(): number {
    return readInt32BE(this.bytes, 0)
  }
}

export { Int32 }
