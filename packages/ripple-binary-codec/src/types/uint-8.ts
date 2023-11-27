import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import { bytesToHex } from '@xrplf/isomorphic/utils'
import { writeUInt8 } from '../utils'

/**
 * Derived UInt class for serializing/deserializing 8 bit UInt
 */
class UInt8 extends UInt {
  protected static readonly width: number = 8 / 8 // 1
  static readonly defaultUInt8: UInt8 = new UInt8(new Uint8Array(UInt8.width))

  constructor(bytes: Uint8Array) {
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
      UInt8.checkUintRange(val, 0, 0xff)

      const buf = new Uint8Array(UInt8.width)
      writeUInt8(buf, val, 0)
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
    return parseInt(bytesToHex(this.bytes), 16)
  }
}

export { UInt8 }
