import { Hash } from './hash'
import { Buffer } from 'buffer/'

/**
 * Hash with a width of 128 bits
 */
class Hash128 extends Hash {
  static readonly width = 16
  static readonly ZERO_128: Hash128 = new Hash128(Buffer.alloc(Hash128.width))

  constructor(bytes: Buffer) {
    if (bytes && bytes.byteLength === 0) {
      bytes = Hash128.ZERO_128.bytes
    }

    super(bytes ?? Hash128.ZERO_128.bytes)
  }

  /**
   * Get the hex representation of a hash-128 bytes, allowing unset
   *
   * @returns hex String of this.bytes
   */
  toHex(): string {
    const hex = this.toBytes().toString('hex').toUpperCase()
    if (/^0+$/.exec(hex)) {
      return ''
    }
    return hex
  }
}

export { Hash128 }
