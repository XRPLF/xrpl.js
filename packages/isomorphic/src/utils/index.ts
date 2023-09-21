import { randomBytes as cryptoRandomBytes } from 'crypto'
import { Utils } from './types'

const OriginalBuffer = Symbol('OriginalBuffer')

interface WithReference extends Uint8Array {
  [OriginalBuffer]: Buffer
}

/**
 * Converts a Node.js Buffer to a Uint8Array for uniform behavior with browser implementations.
 *
 * Choices:
 * 1. Directly returning the Buffer:
 *    - Operation: Return Buffer as is (a Buffer *IS* an instanceof Uint8Array).
 *    - Pros: Most memory and performance efficient.
 *    - Cons: Violates strict Uint8Array typing and may lead to issues where Buffer-specific features are [ab]used.
 *
 * 2. Using `new Uint8Array(buffer)` or `Uint8Array.from(buffer)`:
 *    - Operation: Copies the buffer's data into a new Uint8Array.
 *    - Pros: Ensures data isolation; memory-safe.
 *    - Cons: Less performant due to data duplication.
 *
 * 3. Using buf.buffer slice:
 *    - Operation: Shares memory between Buffer and Uint8Array.
 *    - Pros: Performant.
 *    - Cons: Risks with shared memory and potential for invalid references.
 *
 * 4. Using buf.buffer slice and keeping a Buffer reference for ownership semantics:
 *    - Operation: Shares memory and associates the original Buffer with the resulting Uint8Array.
 *    - Pros: Performant while ensuring the original Buffer isn't garbage collected.
 *    - Cons: Risks with shared memory but mitigates potential for invalid references.
 *
 * The chosen method (4) prioritizes performance by sharing memory while ensuring buffer ownership.
 *
 * @param {Buffer} buffer - The Node.js Buffer to convert.
 * @returns {Uint8Array} Resulting Uint8Array sharing the same memory as the Buffer and maintaining a reference to it.
 */
function toUint8Array(buffer: Buffer): Uint8Array {
  // TODO: are we sure this will work? why not just return Buffer and document it?
  const u8Array = new Uint8Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  ) as WithReference
  u8Array[OriginalBuffer] = buffer
  return u8Array
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
