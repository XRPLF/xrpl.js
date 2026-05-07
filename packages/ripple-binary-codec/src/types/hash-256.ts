import { Hash } from './hash'
import { SerializedTypeID } from './serialized-type'

/**
 * Hash with a width of 256 bits
 */
class Hash256 extends Hash {
  static readonly width = 32
  static readonly ZERO_256 = new Hash256(new Uint8Array(Hash256.width))

  constructor(bytes: Uint8Array) {
    super(bytes ?? Hash256.ZERO_256.bytes)
  }

  getSType(): SerializedTypeID {
    return SerializedTypeID.STI_UINT256
  }
}

export { Hash256 }
