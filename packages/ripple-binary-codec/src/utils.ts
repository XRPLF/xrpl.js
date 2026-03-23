// Even though this comes from NodeJS it is valid in the browser
import TypedArray = NodeJS.TypedArray

/**
 * Writes value to array at the specified offset. The value must be a valid unsigned 8-bit integer.
 * @param array Uint8Array to be written to
 * @param value Number to be written to array.
 * @param offset plus the number of bytes written.
 */
export function writeUInt8(
  array: Uint8Array,
  value: number,
  offset: number,
): void {
  value = Number(value)
  array[offset] = value
}

/**
 * Writes value to array at the specified offset as big-endian. The value must be a valid unsigned 16-bit integer.
 * @param array Uint8Array to be written to
 * @param value Number to be written to array.
 * @param offset plus the number of bytes written.
 */
export function writeUInt16BE(
  array: Uint8Array,
  value: number,
  offset: number,
): void {
  value = Number(value)

  array[offset] = value >>> 8
  array[offset + 1] = value
}

/**
 * Writes value to array at the specified offset as big-endian. The value must be a valid unsigned 32-bit integer.
 * @param array Uint8Array to be written to
 * @param value Number to be written to array.
 * @param offset plus the number of bytes written.
 */
export function writeUInt32BE(
  array: Uint8Array,
  value: number,
  offset: number,
): void {
  array[offset] = (value >>> 24) & 0xff
  array[offset + 1] = (value >>> 16) & 0xff
  array[offset + 2] = (value >>> 8) & 0xff
  array[offset + 3] = value & 0xff
}

/**
 * Writes a signed 32-bit integer to a Uint8Array at the specified offset (big-endian).
 *
 * @param array - The Uint8Array to write to.
 * @param value - The signed 32-bit integer to write.
 * @param offset - The offset at which to write.
 */
export function writeInt32BE(
  array: Uint8Array,
  value: number,
  offset: number,
): void {
  new DataView(array.buffer, array.byteOffset, array.byteLength).setInt32(
    offset,
    value,
    false,
  )
}

/**
 * Writes a signed 64-bit integer (BigInt) to a Uint8Array at the specified offset (big-endian).
 *
 * @param array - The Uint8Array to write to.
 * @param value - The signed 64-bit integer (BigInt) to write.
 * @param offset - The offset at which to write.
 */
export function writeInt64BE(
  array: Uint8Array,
  value: bigint,
  offset: number,
): void {
  new DataView(array.buffer, array.byteOffset, array.byteLength).setBigInt64(
    offset,
    value,
    false,
  )
}

/**
 * Reads an unsigned, big-endian 16-bit integer from the array at the specified offset.
 * @param array Uint8Array to read
 * @param offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2
 */
export function readUInt16BE(array: Uint8Array, offset: number): string {
  return new DataView(array.buffer).getUint16(offset, false).toString(10)
}

/**
 * Reads an unsigned, big-endian 16-bit integer from the array at the specified offset.
 * @param array Uint8Array to read
 * @param offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4
 */
export function readUInt32BE(array: Uint8Array, offset: number): string {
  return new DataView(array.buffer).getUint32(offset, false).toString(10)
}

/**
 * Reads a signed 32-bit integer from a Uint8Array at the specified offset (big-endian).
 *
 * @param array - The Uint8Array to read from.
 * @param offset - The offset at which to start reading.
 * @returns The signed 32-bit integer.
 */
export function readInt32BE(array: Uint8Array, offset: number): number {
  return new DataView(
    array.buffer,
    array.byteOffset,
    array.byteLength,
  ).getInt32(offset, false)
}

/**
 * Reads a signed 64-bit integer (BigInt) from a Uint8Array at the specified offset (big-endian).
 *
 * @param array - The Uint8Array to read from.
 * @param offset - The offset at which to start reading.
 * @returns The signed 64-bit integer (BigInt).
 */
export function readInt64BE(array: Uint8Array, offset: number): bigint {
  return new DataView(
    array.buffer,
    array.byteOffset,
    array.byteLength,
  ).getBigInt64(offset, false)
}

/**
 * Compares two Uint8Array or ArrayBuffers
 * @param a first array to compare
 * @param b second array to compare
 */
export function equal(
  a: Uint8Array | ArrayBuffer,
  b: Uint8Array | ArrayBuffer,
): boolean {
  const aUInt = a instanceof ArrayBuffer ? new Uint8Array(a, 0) : a
  const bUInt = b instanceof ArrayBuffer ? new Uint8Array(b, 0) : b
  if (aUInt.byteLength != bUInt.byteLength) return false
  if (aligned32(aUInt) && aligned32(bUInt)) return compare32(aUInt, bUInt) === 0
  if (aligned16(aUInt) && aligned16(bUInt)) return compare16(aUInt, bUInt) === 0
  return compare8(aUInt, bUInt) === 0
}

/**
 * Compares two 8 bit aligned arrays
 * @param a first array to compare
 * @param b second array to compare
 */
function compare8(a, b) {
  const ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  const ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
  return compare(ua, ub)
}

/**
 * Compares two 16 bit aligned arrays
 * @param a first array to compare
 * @param b second array to compare
 */
function compare16(a: Uint8Array, b: Uint8Array) {
  const ua = new Uint16Array(a.buffer, a.byteOffset, a.byteLength / 2)
  const ub = new Uint16Array(b.buffer, b.byteOffset, b.byteLength / 2)
  return compare(ua, ub)
}

/**
 * Compares two 32 bit aligned arrays
 * @param a first array to compare
 * @param b second array to compare
 */
function compare32(a: Uint8Array, b: Uint8Array) {
  const ua = new Uint32Array(a.buffer, a.byteOffset, a.byteLength / 4)
  const ub = new Uint32Array(b.buffer, b.byteOffset, b.byteLength / 4)
  return compare(ua, ub)
}

/**
 * Compare two TypedArrays
 * @param a first array to compare
 * @param b second array to compare
 */
export function compare(a: TypedArray, b: TypedArray): 1 | -1 | 0 {
  if (a.byteLength !== b.byteLength) {
    throw new Error('Cannot compare arrays of different length')
  }

  for (let i = 0; i < a.length - 1; i += 1) {
    if (a[i] > b[i]) return 1
    if (a[i] < b[i]) return -1
  }
  return 0
}

/**
 * Determine if TypedArray is 16 bit aligned
 * @param array The array to check
 */
function aligned16(array: TypedArray) {
  return array.byteOffset % 2 === 0 && array.byteLength % 2 === 0
}

/**
 * Determine if TypedArray is 32 bit aligned
 * @param array The array to check
 */
function aligned32(array: TypedArray) {
  return array.byteOffset % 4 === 0 && array.byteLength % 4 === 0
}
