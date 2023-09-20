import { createHash } from 'crypto'
import { Hash, HashFn, Input } from './index'
import normInput from './normInput'

/**
 * Wrap createHash from node to provide an interface that is isomorphic
 *
 * @param type - the hash name
 * @param fn - {createHash} the hash factory
 */
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
      update(input: Input): Hash {
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
