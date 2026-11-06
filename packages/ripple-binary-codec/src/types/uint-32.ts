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
   * Construct a UInt32 object from a number or a base-10 integer string
   *
   * @param val UInt32 object, number or base-10 integer string
   */
  static from<T extends UInt32 | number | string>(val: T): UInt32 {
    if (val instanceof UInt32) {
      return val
    }

    const buf = new Uint8Array(UInt32.width)

    if (typeof val === 'string') {
      // Like rippled (beast::lexicalCastThrow), only accept a base-10 integer
      // string with an optional leading '+'. `parseInt` alone would turn '1e3'
      // into 1, 'abc' into 0 and '-1' into 4294967295.
      if (!/^\+?\d+$/u.test(val)) {
        throw new Error('Cannot construct UInt32 from given value')
      }
      const num = Number(val)
      UInt32.checkUintRange(num, 0, 0xffffffff)
      writeUInt32BE(buf, num, 0)
      return new UInt32(buf)
    }

    if (typeof val === 'number' && Number.isInteger(val)) {
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
