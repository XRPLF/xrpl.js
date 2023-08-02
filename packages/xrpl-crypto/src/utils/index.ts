import { randomBytes as cryptoRandomBytes } from 'crypto'

export function bytesToHex(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString('hex').toUpperCase()
}

export function hexToBytes(hex: string): Uint8Array {
  return Buffer.from(hex, 'hex')
}

export function randomBytes(n: number): Uint8Array {
  return cryptoRandomBytes(n)
}
