import { UInt } from './uint'
import { BinaryParser } from '../serdes/binary-parser'
import { bytesToHex, concat, hexToBytes } from '@xrplf/isomorphic/utils'
import { readUInt32BE, writeUInt32BE } from '../utils'

const HEX_REGEX = /^[a-fA-F0-9]{1,16}$/
const mask = BigInt(0x00000000ffffffff)

/**
 * Derived UInt class for serializing/deserializing 64 bit UInt
 */
class UInt64 extends UInt {
  protected static readonly width: number = 64 / 8 // 8
  static readonly defaultUInt64: UInt64 = new UInt64(
    new Uint8Array(UInt64.width),
  )

  constructor(bytes: Uint8Array) {
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
  static from<T extends UInt64 | string | bigint | number>(val: T): UInt64 {
    if (val instanceof UInt64) {
      return val
    }

    let buf = new Uint8Array(UInt64.width)

    if (typeof val === 'number') {
      if (val < 0) {
        throw new Error('value must be an unsigned integer')
      }

      const number = BigInt(val)

      const intBuf = [new Uint8Array(4), new Uint8Array(4)]
      writeUInt32BE(intBuf[0], Number(number >> BigInt(32)), 0)
      writeUInt32BE(intBuf[1], Number(number & BigInt(mask)), 0)

      return new UInt64(concat(intBuf))
    }

    if (typeof val === 'string') {
      if (!HEX_REGEX.test(val)) {
        throw new Error(`${val} is not a valid hex-string`)
      }

      const strBuf = val.padStart(16, '0')
      buf = hexToBytes(strBuf)
      return new UInt64(buf)
    }

    if (typeof val === 'bigint') {
      const intBuf = [new Uint8Array(4), new Uint8Array(4)]
      writeUInt32BE(intBuf[0], Number(Number(val >> BigInt(32))), 0)
      writeUInt32BE(intBuf[1], Number(val & BigInt(mask)), 0)

      return new UInt64(concat(intBuf))
    }

    throw new Error('Cannot construct UInt64 from given value')
  }

  /**
   * The JSON representation of a UInt64 object
   *
   * @returns a hex-string
   */
  toJSON(): string {
    return bytesToHex(this.bytes)
  }

  /**
   * Get the value of the UInt64
   *
   * @returns the number represented buy this.bytes
   */
  valueOf(): bigint {
    const msb = BigInt(readUInt32BE(this.bytes.slice(0, 4), 0))
    const lsb = BigInt(readUInt32BE(this.bytes.slice(4), 0))
    return (msb << BigInt(32)) | lsb
  }

  /**
   * Get the bytes representation of the UInt64 object
   *
   * @returns 8 bytes representing the UInt64
   */
  toBytes(): Uint8Array {
    return this.bytes
  }
}

export { UInt64 }
