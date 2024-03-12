import {
  bytesToHex as nobleBytesToHex,
  randomBytes as nobleRandomBytes,
} from '@noble/hashes/utils'
import type {
  BytesToHexFn,
  HexToBytesFn,
  HexToStringFn,
  RandomBytesFn,
  StringToHexFn,
} from './types'
import { HEX_REGEX } from './shared'

/* eslint-disable func-style -- Typed to ensure uniformity between node and browser implementations and docs */
export const bytesToHex: typeof BytesToHexFn = (bytes) => {
  const hex = nobleBytesToHex(
    bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes),
  )
  return hex.toUpperCase()
}

// A clone of hexToBytes from @noble/hashes without the length checks. This allows us to do our own checks.
export const hexToBytes: typeof HexToBytesFn = (hex): Uint8Array => {
  const len = hex.length
  const array = new Uint8Array(len / 2)
  if (!HEX_REGEX.test(hex)) {
    throw new Error('Invalid hex string')
  }
  for (let i = 0; i < array.length; i++) {
    const j = i * 2
    const hexByte = hex.slice(j, j + 2)
    const byte = Number.parseInt(hexByte, 16)
    if (Number.isNaN(byte) || byte < 0) {
      throw new Error('Invalid byte sequence')
    }
    array[i] = byte
  }
  return array
}

export const hexToString: typeof HexToStringFn = (
  hex: string,
  encoding = 'utf8',
): string => {
  return new TextDecoder(encoding).decode(hexToBytes(hex))
}

export const stringToHex: typeof StringToHexFn = (string: string): string => {
  return bytesToHex(new TextEncoder().encode(string))
}
/* eslint-enable func-style */

export const randomBytes: typeof RandomBytesFn = nobleRandomBytes
export * from './shared'
