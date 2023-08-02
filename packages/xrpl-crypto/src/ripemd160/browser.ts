import { ripemd160 as nobleImpl } from '@noble/hashes/ripemd160'

import wrapNoble from '../internal/wrapNoble'

// eslint-disable-next-line import/prefer-default-export
export const ripemd160 = wrapNoble(nobleImpl)
