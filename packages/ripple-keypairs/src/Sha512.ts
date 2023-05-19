/* eslint-disable no-bitwise --
 * lots of bitwise operators necessary for this */
import * as hashjs from 'hash.js'
import BigNum = require('bn.js')

export default class Sha512 {
  // TODO: type of `hash`?
  hash: any

  constructor() {
    this.hash = hashjs.sha512()
  }

  add(bytes) {
    this.hash.update(bytes)
    return this
  }

  addU32(i) {
    return this.add([
      (i >>> 24) & 0xff,
      (i >>> 16) & 0xff,
      (i >>> 8) & 0xff,
      i & 0xff,
    ])
  }

  finish() {
    return this.hash.digest()
  }

  first256() {
    return this.finish().slice(0, 32)
  }

  first256BN() {
    return new BigNum(this.first256())
  }
}
