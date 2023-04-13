/* eslint-disable no-bitwise --
 * lots of bitwise operators necessary for this */

// TODO: maybe use the custom class: sha512_256
import { sha512 } from '@noble/hashes/sha512'
import { bytesToNumberBE } from '@noble/curves/abstract/utils'

export default class Sha512 {
  // TODO: type of `hash`?
  hash: ReturnType<typeof sha512.create>

  constructor() {
    this.hash = sha512.create()
  }

  add(bytes) {
    this.hash.update(Buffer.from(bytes))
    return this
  }

  addU32(i) {
    return this.add([
      (i >>> 24) & 0xff,
      (i >>> 16) & 0xff,
      (i >>> 8) & 0xff,
      i & 0xff,
    ])
  }

  finish() {
    return this.hash.digest()
  }

  first256() {
    return this.finish().slice(0, 32)
  }

  first256BN(): bigint {
    return bytesToNumberBE(this.first256())
  }
}
