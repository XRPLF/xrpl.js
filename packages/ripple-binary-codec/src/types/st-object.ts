import { makeClass } from '../utils/make-class'
import { Enums } from '../enums'
const _ = require('lodash')
const { BinarySerializer } = require('../serdes/binary-serializer')
const { ObjectEndMarker } = Enums.Field
const { SerializedType } = require('./serialized-type')

const STObject = makeClass({
  mixins: SerializedType,
  statics: {
    fromParser (parser, hint) {
      const end = typeof hint === 'number' ? parser.pos() + hint : null
      const so = new this()
      while (!parser.end(end)) {
        const field = parser.readField()
        if (field === ObjectEndMarker) {
          break
        }
        so[field] = parser.readFieldValue(field)
      }
      return so
    },
    from (value) {
      if (value instanceof this) {
        return value
      }
      if (typeof value === 'object') {
        return _.transform(value, (so, val, key) => {
          const field = Enums.Field[key]
          if (field) {
            so[field] = field.associatedType.from(val)
          } else {
            so[key] = val
          }
        }, new this())
      }
      throw new Error(`${value} is unsupported`)
    }
  },
  fieldKeys () {
    return Object.keys(this).map(k => Enums.Field[k]).filter(Boolean)
  },
  toJSON () {
    // Otherwise seemingly result will have same prototype as `this`
    const accumulator = {} // of only `own` properties
    return _.transform(this, (result, value, key) => {
      result[key] = value && value.toJSON ? value.toJSON() : value
    }, accumulator)
  },
  toBytesSink (sink, filter = () => true) {
    const serializer = new BinarySerializer(sink)
    const fields = this.fieldKeys()
    const sorted = _.sortBy(fields, 'ordinal')
    sorted.filter(filter).forEach(field => {
      const value = this[field]
      if (!field.isSerialized) {
        return
      }
      serializer.writeFieldAndValue(field, value)
    })
  }
}, undefined)

export {
  STObject
}
