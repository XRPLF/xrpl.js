import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

/**
 * Wrap node's native sha256 implementation in HashFn
 */
export const sha256 = wrapCryptoCreateHash('sha256', createHash)
