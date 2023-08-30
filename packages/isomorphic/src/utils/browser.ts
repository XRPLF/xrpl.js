import {
  bytesToHex as nobleBytesToHex,
  hexToBytes as nobleHexToBytes,
  randomBytes as nobleRandomBytes,
} from '@noble/hashes/utils'
import { BytesToHexFn, HexToBytesFn, RandomBytesFn } from './types'

// Typed to ensure uniformity between node and browser implementations and docs
/* eslint-disable func-style, eslint-comments/disable-enable-pair -- see above */
const bytesToHex: typeof BytesToHexFn = (bytes: Uint8Array | number[]) => {
  return nobleBytesToHex(
    bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes),
  ).toUpperCase()
}

const hexToBytes: typeof HexToBytesFn = (hex: string): Uint8Array => {
  return nobleHexToBytes(hex)
}

const randomBytes: typeof RandomBytesFn = (size: number): Uint8Array => {
  return nobleRandomBytes(size)
}

export { bytesToHex, hexToBytes, randomBytes }
