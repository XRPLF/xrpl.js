import { createHash } from 'crypto'
import { HashFn, Input } from './index'
import normInput from './normInput'

export default function wrapCryptoCreateHash(
  type: string,
  fn: typeof createHash,
) {
  const hashFn = ((input: Input) => {
    return new Uint8Array(fn(type).update(normInput(input)).digest().buffer)
  }) as HashFn
  hashFn.create = () => {
    const hash = fn(type)
    return {
      update(input: Input) {
        hash.update(normInput(input))
        return this
      },
      digest(): Uint8Array {
        return new Uint8Array(hash.digest().buffer)
      },
    }
  }
  return hashFn
}
