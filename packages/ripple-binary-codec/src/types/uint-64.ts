import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import bigInt = require('big-integer')
import { isInstance } from 'big-integer'
import { Buffer } from 'buffer/'

const HEX_REGEX = /^[a-fA-F0-9]{1,16}$/
const mask = bigInt(0x00000000ffffffff)

/**
 * Derived UInt class for serializing/deserializing 64 bit UInt
 */
class UInt64 extends UInt {
  protected static readonly width: number = 64 / 8 // 8
  static readonly defaultUInt64: UInt64 = new UInt64(Buffer.alloc(UInt64.width))

  constructor(bytes: Buffer) {
    super(bytes ?? UInt64.defaultUInt64.bytes)
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt64(parser.read(UInt64.width))
  }

  /**
   * Construct a UInt64 object
   *
   * @param val A UInt64, hex-string, bigInt, or number
   * @returns A UInt64 object
   */
  static from<T extends UInt64 | string | bigInt.BigInteger | number>(
    val: T,
  ): UInt64 {
    if (val instanceof UInt64) {
      return val
    }

    let buf = Buffer.alloc(UInt64.width)

    if (typeof val === 'number') {
      if (val < 0) {
        throw new Error('value must be an unsigned integer')
      }

      const number = bigInt(val)

      const intBuf = [Buffer.alloc(4), Buffer.alloc(4)]
      intBuf[0].writeUInt32BE(Number(number.shiftRight(32)), 0)
      intBuf[1].writeUInt32BE(Number(number.and(mask)), 0)

      return new UInt64(Buffer.concat(intBuf))
    }

    if (typeof val === 'string') {
      if (!HEX_REGEX.test(val)) {
        throw new Error(`${val} is not a valid hex-string`)
      }

      const strBuf = val.padStart(16, '0')
      buf = Buffer.from(strBuf, 'hex')
      return new UInt64(buf)
    }

    if (isInstance(val)) {
      const intBuf = [Buffer.alloc(4), Buffer.alloc(4)]
      intBuf[0].writeUInt32BE(Number(val.shiftRight(bigInt(32))), 0)
      intBuf[1].writeUInt32BE(Number(val.and(mask)), 0)

      return new UInt64(Buffer.concat(intBuf))
    }

    throw new Error('Cannot construct UInt64 from given value')
  }

  /**
   * The JSON representation of a UInt64 object
   *
   * @returns a hex-string
   */
  toJSON(): string {
    return this.bytes.toString('hex').toUpperCase()
  }

  /**
   * Get the value of the UInt64
   *
   * @returns the number represented buy this.bytes
   */
  valueOf(): bigInt.BigInteger {
    const msb = bigInt(this.bytes.slice(0, 4).readUInt32BE(0))
    const lsb = bigInt(this.bytes.slice(4).readUInt32BE(0))
    return msb.shiftLeft(bigInt(32)).or(lsb)
  }

  /**
   * Get the bytes representation of the UInt64 object
   *
   * @returns 8 bytes representing the UInt64
   */
  toBytes(): Buffer {
    return this.bytes
  }
}

export { UInt64 }
