import { sha512 } from '@xrplf/isomorphic/sha512'
import { bytesToNumberBE } from '@noble/curves/abstract/utils'

type Input = Uint8Array | number[] | string

export default class Sha512 {
  // instantiate empty sha512 hash
  hash = sha512.create()

  static half(input: Input): Uint8Array {
    return new Sha512().add(input).first256()
  }

  add(bytes: Input): this {
    this.hash.update(bytes)
    return this
  }

  addU32(i: number): this {
    const buffer = new Uint8Array(4)
    new DataView(buffer.buffer).setUint32(0, i)
    return this.add(buffer)
  }

  finish(): Uint8Array {
    return this.hash.digest()
  }

  first256(): Uint8Array {
    return this.finish().slice(0, 32)
  }

  first256BigInt(): bigint {
    return bytesToNumberBE(this.first256())
  }
}
