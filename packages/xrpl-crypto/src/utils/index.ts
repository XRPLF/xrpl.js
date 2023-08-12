import { randomBytes as cryptoRandomBytes } from 'crypto'
import {
  bytesToHex as nobleBytesToHex,
  // hexToBytes as nobelHexToBytes,
} from '@noble/hashes/utils'

export function bytesToHex(buffer: Uint8Array): string {
  return nobleBytesToHex(buffer).toUpperCase()
}


export function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new Error(`hex string expected, got ${typeof hex}`)
  }
  const len = hex.length
  const array = new Uint8Array(len / 2)
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

export function randomBytes(n: number): Uint8Array {
  return cryptoRandomBytes(n)
}

export * from './shared'
