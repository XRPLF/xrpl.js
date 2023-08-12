export function writeUInt8(
  buf: Uint8Array,
  value: number,
  offset: number,
): void {
  value = Number(value)
  buf[offset] = value
}

export function writeUInt16BE(
  buf: Uint8Array,
  value: number,
  offset: number,
): void {
  value = Number(value)

  buf[offset++] = value >>> 8
  buf[offset++] = value
}

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

export function readUInt16BE(array: Uint8Array, offset: number): string {
  return new DataView(array.buffer).getUint16(offset, false).toString(10)
}

export function readUInt32BE(array: Uint8Array, offset: number): string {
  return new DataView(array.buffer).getUint32(offset, false).toString(10)
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function equal(a, b) {
  if (a instanceof ArrayBuffer) a = new Uint8Array(a, 0)
  if (b instanceof ArrayBuffer) b = new Uint8Array(b, 0)
  if (a.byteLength != b.byteLength) return false
  if (aligned32(a) && aligned32(b)) return equal32(a, b)
  if (aligned16(a) && aligned16(b)) return equal16(a, b)
  return equal8(a, b)
}

function equal8(a, b) {
  const ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  const ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
  return compare(ua, ub)
}
function equal16(a, b) {
  const ua = new Uint16Array(a.buffer, a.byteOffset, a.byteLength / 2)
  const ub = new Uint16Array(b.buffer, b.byteOffset, b.byteLength / 2)
  return compare(ua, ub)
}
function equal32(a, b) {
  const ua = new Uint32Array(a.buffer, a.byteOffset, a.byteLength / 4)
  const ub = new Uint32Array(b.buffer, b.byteOffset, b.byteLength / 4)
  return compare(ua, ub)
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function compare(a, b) {
  for (let i = 0; i < a.length - 1; i += 1) {
    if (a[i] > b[i]) return 1
    if (a[i] < b[i]) return -1
  }
  return 0
}

function aligned16(a) {
  return a.byteOffset % 2 === 0 && a.byteLength % 2 === 0
}

function aligned32(a) {
  return a.byteOffset % 4 === 0 && a.byteLength % 4 === 0
}
