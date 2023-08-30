import { sha256 as nobleImpl } from '@noble/hashes/sha256'

import wrapNoble from '../internal/wrapNoble'

export const sha256 = wrapNoble(nobleImpl)
