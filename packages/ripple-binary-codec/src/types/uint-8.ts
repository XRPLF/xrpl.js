import { makeClass } from '../utils/make-class'
import { UInt } from './uint'

const UInt8 = makeClass({
  inherits: UInt,
  statics: { width: 1 }
}, undefined)

export {
  UInt8
}
