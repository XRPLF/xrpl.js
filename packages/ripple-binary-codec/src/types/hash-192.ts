import { Hash } from './hash'
import { SerializedTypeID } from './serialized-type'

/**
 * Hash with a width of 192 bits
 */
class Hash192 extends Hash {
  static readonly width = 24
  static readonly ZERO_192: Hash192 = new Hash192(new Uint8Array(Hash192.width))

  constructor(bytes?: Uint8Array) {
    if (bytes?.byteLength === 0) {
      bytes = Hash192.ZERO_192.bytes
    }

    super(bytes ?? Hash192.ZERO_192.bytes)
  }

  getSType(): SerializedTypeID {
    return SerializedTypeID.STI_UINT192
  }
}

export { Hash192 }
