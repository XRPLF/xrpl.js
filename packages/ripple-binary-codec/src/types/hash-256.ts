import { Hash } from './hash'
import { Buffer } from 'buffer/'

/**
 * Hash with a width of 256 bits
 */
class Hash256 extends Hash {
  static readonly width = 32
  static readonly ZERO_256 = new Hash256(Buffer.alloc(Hash256.width))

  constructor(bytes: Buffer) {
    super(bytes ?? Hash256.ZERO_256.bytes)
  }
}

export { Hash256 }
