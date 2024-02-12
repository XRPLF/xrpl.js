import { CHash } from '@noble/hashes/utils'
import { Hash, HashFn, Input } from './types'
import normalizeInput from './normalizeInput'

/**
 * Wrap a CHash object from @noble/hashes to provide a interface that is isomorphic
 *
 * @param chash - {CHash} hash function to wrap
 */
export default function wrapNoble(chash: CHash): HashFn {
  function wrapped(input: Input): Uint8Array {
    return chash(normalizeInput(input))
  }

  wrapped.create = (): Hash => {
    const hash = chash.create()
    return {
      update(input: Input): Hash {
        hash.update(normalizeInput(input))
        return this
      },
      digest(): Uint8Array {
        return hash.digest()
      },
    }
  }
  return wrapped
}
