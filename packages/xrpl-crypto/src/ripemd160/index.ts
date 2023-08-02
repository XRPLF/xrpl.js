import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

// eslint-disable-next-line import/prefer-default-export
export const ripemd160 = wrapCryptoCreateHash('ripemd160', createHash)
