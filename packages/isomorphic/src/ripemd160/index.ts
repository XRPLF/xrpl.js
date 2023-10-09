import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

/**
 * Wrap node's native ripemd160 implementation in HashFn
 */
export const ripemd160 = wrapCryptoCreateHash('ripemd160', createHash)
