import { sha512 as nobleImpl } from '@noble/hashes/sha512'

import wrapNoble from '../internal/wrapNoble'

export const sha512 = wrapNoble(nobleImpl)
