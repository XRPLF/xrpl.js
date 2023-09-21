import { randomBytes as cryptoRandomBytes } from 'crypto'
import { Utils } from './types'

/**
 * Converts a Node.js Buffer to a Uint8Array for strict uniformity with browser implementations.
 *
 * Although a Buffer is a subclass of Uint8Array in Node.js, this function ensures an explicit
 * representation as a Uint8Array without copying underlying bytes, offering an efficient conversion.
 *
 * @param {Buffer} buffer - The Node.js Buffer to convert.
 * @returns {Uint8Array} Resulting Uint8Array sharing the same memory as the Buffer.
 */
function normalize(buffer: Buffer): Uint8Array {
  // different copying semantics to Uint8Array.from
  return new Uint8Array(buffer)
}

const utils: Utils = {
  bytesToHex(bytes) {
    const buf = Buffer.from(bytes)
    return buf.toString('hex').toUpperCase()
  },
  hexToBytes(hex) {
    return normalize(Buffer.from(hex, 'hex'))
  },
  randomBytes(size) {
    return normalize(cryptoRandomBytes(size))
  },
}

export const { bytesToHex, hexToBytes, randomBytes } = utils
