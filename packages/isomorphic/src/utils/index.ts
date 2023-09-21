import { randomBytes as cryptoRandomBytes } from 'crypto'
import { Utils } from './types'

/**
 * Converts a Node.js Buffer to a Uint8Array for uniform behavior with browser implementations.
 *
 * Choices:
 * 1. Using `new Uint8Array(buffer)` or `Uint8Array.from(buffer)` (Chosen Method):
 *    - Operation: Copies the buffer's data into a new Uint8Array.
 *    - Pros: Ensures data isolation; memory-safe.
 *    - Cons: Less memory-efficient due to data duplication.
 *
 * 2. Using `buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)`:
 *    - Operation: Shares memory between Buffer and Uint8Array.
 *    - Pros: Memory-efficient.
 *    - Cons: Risks with shared memory and potential for invalid references.
 *
 * 3. Directly returning the Buffer:
 *    - Operation: Return Buffer as is (a Buffer *IS* an instanceof Uint8Array).
 *    - Pros: Most memory and performance efficient.
 *    - Cons: Violates strict Uint8Array typing and may introduce bugs if Buffer-specific features are abused.
 *
 * The chosen method (1) prioritizes safety and predictability by copying the buffer's data.
 *
 * @param {Buffer} buffer - The Node.js Buffer to convert.
 * @returns {Uint8Array} Resulting Uint8Array with data copied from the Buffer.
 */
function toUint8Array(buffer: Buffer): Uint8Array {
  // TODO: are there /actually/ risks with option 2?
  //       why not just option 3? make sure non TS users
  //       don't shoot themselves in the foot ?
  return Uint8Array.from(buffer)
}

const utils: Utils = {
  bytesToHex(bytes) {
    const buf = Buffer.from(bytes)
    return buf.toString('hex').toUpperCase()
  },
  hexToBytes(hex) {
    return toUint8Array(Buffer.from(hex, 'hex'))
  },
  randomBytes(size) {
    return toUint8Array(cryptoRandomBytes(size))
  },
}

export const { bytesToHex, hexToBytes, randomBytes } = utils
