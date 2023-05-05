import { randomBytes as cryptoRandomBytes } from 'crypto'

export function bytesToHex(buffer: Uint8Array) {
  return Buffer.from(buffer).toString('hex').toUpperCase()
}

export function hexToBytes(hex: string) {
  return u8(Buffer.from(hex, 'hex'))
}

export function randomBytes(n: number) {
  return u8(cryptoRandomBytes(n))
}

function u8(buffer: Buffer) {
  return new Uint8Array(buffer)
}
