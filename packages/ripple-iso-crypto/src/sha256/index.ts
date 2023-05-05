import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

// eslint-disable-next-line import/prefer-default-export
export const sha256 = wrapCryptoCreateHash('sha256', createHash)
