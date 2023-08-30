import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

export const sha256 = wrapCryptoCreateHash('sha256', createHash)
