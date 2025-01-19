import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import { readUInt32BE, writeUInt32BE } from '../utils'

/**
 * Derived UInt class for serializing/deserializing 32 bit UInt
 */
class UInt32 extends UInt {
  protected static readonly width: number = 32 / 8 // 4
  static readonly defaultUInt32: UInt32 = new UInt32(
    new Uint8Array(UInt32.width),
  )

  constructor(bytes: Uint8Array) {
    super(bytes ?? UInt32.defaultUInt32.bytes)
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt32(parser.read(UInt32.width))
  }

  /**
   * Construct a UInt32 object from a number
   *
   * @param val UInt32 object or number
   */
  static from<T extends UInt32 | number | string>(val: T): UInt32 {
    if (val instanceof UInt32) {
      return val
    }

    const buf = new Uint8Array(UInt32.width)

    if (typeof val === 'string') {
      const num = Number.parseInt(val)
      writeUInt32BE(buf, num, 0)
      return new UInt32(buf)
    }

    if (typeof val === 'number') {
      UInt32.checkUintRange(val, 0, 0xffffffff)
      writeUInt32BE(buf, val, 0)
      return new UInt32(buf)
    }

    throw new Error('Cannot construct UInt32 from given value')
  }

  /**
   * get the value of a UInt32 object
   *
   * @returns the number represented by this.bytes
   */
  valueOf(): number {
    return parseInt(readUInt32BE(this.bytes, 0), 10)
  }
}

export { UInt32 }
