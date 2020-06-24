import { makeClass } from '../utils/make-class'
import { Hash } from './hash'

const Hash256 = makeClass({
  inherits: Hash,
  statics: {
    width: 32,
    init () {
      this.ZERO_256 = new this(new Uint8Array(this.width))
    }
  }
}, undefined)

export {
  Hash256
}
