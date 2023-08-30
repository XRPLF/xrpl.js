import { createHash } from 'crypto'
import { Hash, HashFn, Input } from './index'
import normInput from './normInput'

export default function wrapCryptoCreateHash(
  type: string,
  fn: typeof createHash,
): HashFn {
  function hashFn(input: Input): Uint8Array {
    return fn(type).update(normInput(input)).digest()
  }

  hashFn.create = (): Hash => {
    const hash = fn(type)
    return {
      update(input: Input) {
        hash.update(normInput(input))
        return this
      },
      digest(): Uint8Array {
        return hash.digest()
      },
    }
  }
  return hashFn
}
