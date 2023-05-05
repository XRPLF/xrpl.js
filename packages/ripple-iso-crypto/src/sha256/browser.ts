import { sha256 as nobleImpl } from '@noble/hashes/sha256'

import wrapNoble from '../internal/wrapNoble'

// eslint-disable-next-line import/prefer-default-export
export const sha256 = wrapNoble(nobleImpl)
