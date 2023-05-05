import { createHash } from 'crypto'
import { Input } from './index'
import normInput from './normInput'

export default function wrapCryptoCreateHash(
  type: string,
  fn: typeof createHash,
) {
  function hashFn(input: Input) {
    return fn(type).update(normInput(input)).digest()
  }
  hashFn.create = () => {
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
