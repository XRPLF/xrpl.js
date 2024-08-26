import { concatBytes } from '@noble/hashes/utils'

export const HEX_REGEX = /^[A-F0-9]*$/iu

export function concat(views: Uint8Array[]): Uint8Array {
  return concatBytes(...views)
}

export function equal(buf1: Uint8Array, buf2: Uint8Array): boolean {
  if (buf1.byteLength !== buf2.byteLength) {
    return false
  }
  const dv1 = new Int8Array(buf1)
  const dv2 = new Int8Array(buf2)
  for (let i = 0; i !== buf1.byteLength; i++) {
    if (dv1[i] !== dv2[i]) {
      return false
    }
  }
  return true
}
