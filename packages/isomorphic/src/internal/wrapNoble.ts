import { CHash } from '@noble/hashes/utils'
import { Hash, HashFn, Input } from './index'
import normInput from './normInput'

export default function wrapNoble(chash: CHash): HashFn {
  function wrapped(input: Input) {
    return chash(normInput(input))
  }
  wrapped.create = (): Hash => {
    const hash = chash.create()
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
  return wrapped
}
