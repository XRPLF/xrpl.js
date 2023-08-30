import { ripemd160 as nobleImpl } from '@noble/hashes/ripemd160'

import wrapNoble from '../internal/wrapNoble'

export const ripemd160 = wrapNoble(nobleImpl)
