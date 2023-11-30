import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import { readUInt16BE, writeUInt16BE } from '../utils'

/**
 * Derived UInt class for serializing/deserializing 16 bit UInt
 */
class UInt16 extends UInt {
  protected static readonly width: number = 16 / 8 // 2
  static readonly defaultUInt16: UInt16 = new UInt16(
    new Uint8Array(UInt16.width),
  )

  constructor(bytes: Uint8Array) {
    super(bytes ?? UInt16.defaultUInt16.bytes)
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt16(parser.read(UInt16.width))
  }

  /**
   * Construct a UInt16 object from a number
   *
   * @param val UInt16 object or number
   */
  static from<T extends UInt16 | number>(val: T): UInt16 {
    if (val instanceof UInt16) {
      return val
    }

    if (typeof val === 'number') {
      UInt16.checkUintRange(val, 0, 0xffff)

      const buf = new Uint8Array(UInt16.width)
      writeUInt16BE(buf, val, 0)
      return new UInt16(buf)
    }

    throw new Error('Can not construct UInt16 with given value')
  }

  /**
   * get the value of a UInt16 object
   *
   * @returns the number represented by this.bytes
   */
  valueOf(): number {
    return parseInt(readUInt16BE(this.bytes, 0))
  }
}

export { UInt16 }
