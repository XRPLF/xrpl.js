import { randomBytes as cryptoRandomBytes } from 'crypto'
import { BytesToHexFn, HexToBytesFn, RandomBytesFn } from './types'

// Typed to ensure uniformity between node and browser implementations and docs
/* eslint-disable func-style, eslint-comments/disable-enable-pair -- see above */
const bytesToHex: typeof BytesToHexFn = (bytes: Uint8Array | number[]) => {
  return Buffer.from(
    bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes),
  )
    .toString('hex')
    .toUpperCase()
}

const hexToBytes: typeof HexToBytesFn = (hex: string): Uint8Array => {
  return toUintArray(Buffer.from(hex, 'hex'))
}

const randomBytes: typeof RandomBytesFn = (size: number): Uint8Array => {
  return new Uint8Array(cryptoRandomBytes(size).buffer)
}

function toUintArray(buf: Buffer): Uint8Array {
  return new Uint8Array(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  )
}

export { bytesToHex, hexToBytes, randomBytes }
