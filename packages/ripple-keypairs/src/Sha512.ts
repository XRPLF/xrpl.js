/* eslint-disable no-bitwise --
 * lots of bitwise operators necessary for this */
import { sha512 } from '@noble/hashes/sha512'
import { bytesToNumberBE } from '@noble/curves/abstract/utils'

export default class Sha512 {
  hash = sha512.create()

  add(bytes: Uint8Array | number[]): this {
    this.hash.update(Buffer.from(bytes))
    return this
  }

  addU32(i: number): this {
    return this.add([
      (i >>> 24) & 0xff,
      (i >>> 16) & 0xff,
      (i >>> 8) & 0xff,
      i & 0xff,
    ])
  }

  finish(): Uint8Array {
    return this.hash.digest()
  }

  first256(): Uint8Array {
    return this.finish().slice(0, 32)
  }

  first256BN(): bigint {
    return bytesToNumberBE(this.first256())
  }
}
