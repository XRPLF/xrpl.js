import { sha512 as nobleImpl } from '@noble/hashes/sha512'

import wrapNoble from '../internal/wrapNoble'

/**
 * Wrap noble-libs's sha512 implementation in HashFn
 */
export const sha512 = wrapNoble(nobleImpl)
