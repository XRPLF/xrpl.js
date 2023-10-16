import { concatBytes } from '@noble/hashes/utils'

export function concat(views: Uint8Array[]): Uint8Array {
  return concatBytes(...views)
}

//
// export function concat(views: ArrayBufferView[]) {
//   let len = 0
//   for (const view of views) {
//     len += view.byteLength
//   }
//
//   const buf = new Uint8Array(len)
//   let offset = 0
//   for (const view of views) {
//     const uint8view = new Uint8Array(
//       view.buffer,
//       view.byteOffset,
//       view.byteLength,
//     )
//     buf.set(uint8view, offset)
//     offset += uint8view.byteLength
//   }
//
//   return buf
// }

export function equal(buf1: Uint8Array, buf2: Uint8Array) {
  if (buf1.byteLength !== buf2.byteLength) {
    return false
  }
  const dv1 = new Int8Array(buf1)
  const dv2 = new Int8Array(buf2)
  for (let i = 0; i !== buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) {
      return false
    }
  }
  return true
}
