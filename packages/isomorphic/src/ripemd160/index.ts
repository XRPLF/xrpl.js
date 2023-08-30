import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

export const ripemd160 = wrapCryptoCreateHash('ripemd160', createHash)
