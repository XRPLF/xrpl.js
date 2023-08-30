import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

export const sha512 = wrapCryptoCreateHash('sha512', createHash)
