import { CHash } from '@noble/hashes/utils'
import { Hash, HashFn, Input } from './types'
import normInput from './normInput'

/**
 * Wrap a CHash object from @noble/hashes to provide a interface that is isomorphic
 *
 * @param chash - {CHash} hash function to wrap
 */
export default function wrapNoble(chash: CHash): HashFn {
  function wrapped(input: Input): Uint8Array {
    return chash(normInput(input))
  }

  wrapped.create = (): Hash => {
    const hash = chash.create()
    return {
      update(input: Input): Hash {
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
