import { randomBytes as cryptoRandomBytes } from 'crypto'
import type { BytesToHexFn, HexToBytesFn, RandomBytesFn } from './types'
import { HexToStringFn, StringToHexFn } from './types'
import { HEX_REGEX } from './shared'

const OriginalBuffer = Symbol('OriginalBuffer')

/**
 * An extended Uint8Array that incorporates a reference to the original Node.js Buffer.
 *
 * When converting a Node.js Buffer to a Uint8Array, there's an optimization that shares
 * the memory of the original Buffer with the resulting Uint8Array instead of copying data.
 * The Uint8ArrayWithReference interface is used to attach a reference to the original Buffer, ensuring
 * its persistence in memory (preventing garbage collection) as long as the Uint8Array exists.
 * This strategy upholds the ownership semantics of the slice of the ArrayBuffer.
 */
interface Uint8ArrayWithReference extends Uint8Array {
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
  const u8Array = new Uint8Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  ) as Uint8ArrayWithReference
  u8Array[OriginalBuffer] = buffer
  return u8Array
}

/* eslint-disable func-style -- Typed to ensure uniformity between node and browser implementations and docs */
export const bytesToHex: typeof BytesToHexFn = (bytes) => {
  const buf = Buffer.from(bytes)
  return buf.toString('hex').toUpperCase()
}

export const hexToBytes: typeof HexToBytesFn = (hex) => {
  if (!HEX_REGEX.test(hex)) {
    throw new Error('Invalid hex string')
  }
  return toUint8Array(Buffer.from(hex, 'hex'))
}

export const randomBytes: typeof RandomBytesFn = (size) => {
  return toUint8Array(cryptoRandomBytes(size))
}

export const hexToString: typeof HexToStringFn = (
  hex: string,
  encoding = 'utf8',
): string => {
  if (!HEX_REGEX.test(hex)) {
    throw new Error('Invalid hex string')
  }
  return new TextDecoder(encoding).decode(hexToBytes(hex))
}

export const stringToHex: typeof StringToHexFn = (string: string): string => {
  return bytesToHex(new TextEncoder().encode(string))
}
/* eslint-enable func-style */

export * from './shared'
