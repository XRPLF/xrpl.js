import { Hash } from './hash'
import { bytesToHex } from '@xrplf/isomorphic/utils'

/**
 * Hash with a width of 128 bits
 */
class Hash128 extends Hash {
  static readonly width = 16
  static readonly ZERO_128: Hash128 = new Hash128(new Uint8Array(Hash128.width))

  constructor(bytes: Uint8Array) {
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
    const hex = bytesToHex(this.toBytes())
    if (/^0+$/.exec(hex)) {
      return ''
    }
    return hex
  }
}

export { Hash128 }
