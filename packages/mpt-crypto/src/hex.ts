/**
 * Minimal hex <-> byte helpers for the hex-in/hex-out public API. Hex strings
 * are case-insensitive and must contain an even number of `[0-9a-fA-F]`
 * characters with no `0x` prefix, matching the convention used throughout
 * `xrpl.js` for serialized blobs.
 */

const HEX_REGEX = /^[0-9a-fA-F]*$/u

/**
 * Decode a hex string into a Uint8Array.
 *
 * @param hex - The hex string to decode.
 * @param label - A human-readable name used in error messages.
 * @param expectedBytes - Optional exact byte length the result must have.
 * @returns The decoded bytes.
 * @throws If `hex` is malformed or has the wrong length.
 */
export function hexToBytes(
  hex: string,
  label: string,
  expectedBytes?: number,
): Uint8Array {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !HEX_REGEX.test(hex)) {
    throw new Error(`${label} must be an even-length hex string`)
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  if (expectedBytes != null && bytes.length !== expectedBytes) {
    throw new Error(
      `${label} must be ${expectedBytes} bytes (got ${bytes.length})`,
    )
  }
  return bytes
}

/**
 * Encode a Uint8Array as an uppercase hex string.
 *
 * @param bytes - The bytes to encode.
 * @returns The uppercase hex representation.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0')
  }
  return out.toUpperCase()
}
