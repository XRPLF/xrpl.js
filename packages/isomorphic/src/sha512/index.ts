import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

/**
 * Wrap node's native sha512 implementation in HashFn
 */
export const sha512 = wrapCryptoCreateHash('sha512', createHash)
