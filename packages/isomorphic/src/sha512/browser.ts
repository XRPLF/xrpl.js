import { sha512 as nobleImpl } from '@noble/hashes/sha2.js'

import wrapNoble from '../internal/wrapNoble'

/**
 * Wrap noble-libs's sha512 implementation in HashFn
 */
export const sha512 = wrapNoble(nobleImpl)
