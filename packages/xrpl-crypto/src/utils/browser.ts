import { bytesToHex as nobleBytesToHex } from '@noble/hashes/utils'

export { hexToBytes, randomBytes } from '@noble/hashes/utils'

export function bytesToHex(bytes: Uint8Array) {
  return nobleBytesToHex(bytes).toUpperCase()
}

export * from './shared'
