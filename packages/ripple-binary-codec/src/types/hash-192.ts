import { Hash } from './hash'

/**
 * Hash with a width of 192 bits
 */
class Hash192 extends Hash {
  static readonly width = 24
  static readonly ZERO_192: Hash192 = new Hash192(new Uint8Array(Hash192.width))

  constructor(bytes?: Uint8Array) {
    if (bytes && bytes.byteLength === 0) {
      bytes = Hash192.ZERO_192.bytes
    }

    super(bytes ?? Hash192.ZERO_192.bytes)
  }
}

export { Hash192 }
