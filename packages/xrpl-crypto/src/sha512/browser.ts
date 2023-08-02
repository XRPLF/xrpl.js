import { sha512 as nobleImpl } from '@noble/hashes/sha512'

import wrapNoble from '../internal/wrapNoble'

// eslint-disable-next-line import/prefer-default-export
export const sha512 = wrapNoble(nobleImpl)
