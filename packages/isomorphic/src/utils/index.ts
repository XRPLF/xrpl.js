import { randomBytes as cryptoRandomBytes } from 'crypto'
import { BytesToHexFn, HexToBytesFn, RandomBytesFn } from './types'

// Typed to ensure uniformity between node and browser implementations and docs
/* eslint-disable func-style, eslint-comments/disable-enable-pair -- see above */
const bytesToHex: typeof BytesToHexFn = (bytes: Uint8Array) => {
  return Buffer.from(bytes).toString('hex').toUpperCase()
}

const hexToBytes: typeof HexToBytesFn = (hex: string): Uint8Array => {
  return Buffer.from(hex, 'hex')
}

const randomBytes: typeof RandomBytesFn = (size: number): Uint8Array => {
  return new Uint8Array(cryptoRandomBytes(size).buffer)
}

export { bytesToHex, hexToBytes, randomBytes }
