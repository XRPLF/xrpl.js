import {
  bytesToHex as nobleBytesToHex,
  hexToBytes as nobleHexToBytes,
  randomBytes as nobleRandomBytes,
} from '@noble/hashes/utils'
import type { BytesToHexFn, HexToBytesFn, RandomBytesFn } from './types'

/* eslint-disable-next-line func-style -- Typed to ensure uniformity between node and browser implementations and docs */
export const bytesToHex: typeof BytesToHexFn = (bytes) => {
  const hex = nobleBytesToHex(
    bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes),
  )
  return hex.toUpperCase()
}

export const hexToBytes: typeof HexToBytesFn = nobleHexToBytes
export const randomBytes: typeof RandomBytesFn = nobleRandomBytes
