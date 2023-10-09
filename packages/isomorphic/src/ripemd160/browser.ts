import { ripemd160 as nobleImpl } from '@noble/hashes/ripemd160'

import wrapNoble from '../internal/wrapNoble'

/**
 * Wrap noble-libs's ripemd160 implementation in HashFn
 */
export const ripemd160 = wrapNoble(nobleImpl)
