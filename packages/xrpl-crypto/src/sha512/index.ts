import { createHash } from 'crypto'
import wrapCryptoCreateHash from '../internal/wrapCryptoCreateHash'

// eslint-disable-next-line import/prefer-default-export
export const sha512 = wrapCryptoCreateHash('sha512', createHash)
