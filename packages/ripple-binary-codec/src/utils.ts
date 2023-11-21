// Don't know why this comes from NodeJS as it is valid in the browser
import TypedArray = NodeJS.TypedArray

//
/**
 * Writes value to array at the specified offset. The value must be a valid unsigned 8-bit integer. Lifted from Buffer.writeUInt8
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
 * Writes value to array at the specified offset as big-endian. The value must be a valid unsigned 16-bit integer.  Lifted from Buffer.writeUInt16BE
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

  array[offset++] = value >>> 8
  array[offset++] = value
}

/**
 * Writes value to array at the specified offset as big-endian. The value must be a valid unsigned 32-bit integer.  Lifted from Buffer.writeUInt32BE
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
 * Reads an unsigned, big-endian 16-bit integer from buf at the specified offset.
 * @param array Uint8Array to read
 * @param offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2
 */
export function readUInt16BE(array: Uint8Array, offset: number): string {
  return new DataView(array.buffer).getUint16(offset, false).toString(10)
}

/**
 * Reads an unsigned, big-endian 16-bit integer from buf at the specified offset.
 * @param array Uint8Array to read
 * @param offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4
 */
export function readUInt32BE(array: Uint8Array, offset: number): string {
  return new DataView(array.buffer).getUint32(offset, false).toString(10)
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
  if (aligned32(aUInt) && aligned32(bUInt)) return equal32(aUInt, bUInt) === 0
  if (aligned16(aUInt) && aligned16(bUInt)) return equal16(aUInt, bUInt) === 0
  return equal8(aUInt, bUInt) === 0
}

/**
 * Compares two 8 bit aligned arrays
 * @param a first array to compare
 * @param b second array to compare
 */
function equal8(a, b) {
  const ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  const ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
  return compare(ua, ub)
}

/**
 * Compares two 16 bit aligned arrays
 * @param a first array to compare
 * @param b second array to compare
 */
function equal16(a: Uint8Array, b: Uint8Array) {
  const ua = new Uint16Array(a.buffer, a.byteOffset, a.byteLength / 2)
  const ub = new Uint16Array(b.buffer, b.byteOffset, b.byteLength / 2)
  return compare(ua, ub)
}

/**
 * Compares two 32 bit aligned arrays
 * @param a first array to compare
 * @param b second array to compare
 */
function equal32(a: Uint8Array, b: Uint8Array) {
  const ua = new Uint32Array(a.buffer, a.byteOffset, a.byteLength / 4)
  const ub = new Uint32Array(b.buffer, b.byteOffset, b.byteLength / 4)
  return compare(ua, ub)
}

/**
 * Compare two TypedArrays
 * @param a
 * @param b
 */
export function compare(a: TypedArray, b: TypedArray): 1 | -1 | 0 {
  for (let i = 0; i < a.length - 1; i += 1) {
    if (a[i] > b[i]) return 1
    if (a[i] < b[i]) return -1
  }
  return 0
}

/**
 * Determine if TypedArray is 16 bit aligned
 * @param a
 */
function aligned16(a: TypedArray) {
  return a.byteOffset % 2 === 0 && a.byteLength % 2 === 0
}

/**
 * Determine if TypedArray is 32 bit aligned
 * @param a
 */
function aligned32(a: TypedArray) {
  return a.byteOffset % 4 === 0 && a.byteLength % 4 === 0
}
