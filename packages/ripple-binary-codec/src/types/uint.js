'use strict';

const assert = require('assert');
const BN = require('bn.js');
const makeClass = require('../utils/make-class');
const {Comparable, SerializedType} = require('./serialized-type');
const {serializeUIntN} = require('../utils/bytes-utils');
const MAX_VALUES = [0, 255, 65535, 16777215, 4294967295];

function signum(a, b) {
  return a < b ? -1 : a === b ? 0 : 1;
}

const UInt = makeClass({
  mixins: [Comparable, SerializedType],
  UInt(val = 0) {
    const max = MAX_VALUES[this.constructor.width];
    if (val < 0 || !(val <= max)) {
      throw new Error(`${val} not in range 0 <= $val <= ${max}`);
    }
    this.val = val;
  },
  statics: {
    width: 0,
    fromParser(parser) {
      const val = this.width > 4 ? parser.read(this.width) :
                                   parser.readUIntN(this.width);
      return new this(val);
    },
    from(val) {
      return val instanceof this ? val : new this(val);
    }
  },
  toJSON() {
    return this.val;
  },
  valueOf() {
    return this.val;
  },
  compareTo(other) {
    const thisValue = this.valueOf();
    const otherValue = other.valueOf();
    if (thisValue instanceof BN) {
      return otherValue instanceof BN ?
                  thisValue.cmp(otherValue) :
                        thisValue.cmpn(otherValue);
    } else if (otherValue instanceof BN) {
      return -other.compareTo(this);
    }
    assert(typeof otherValue === 'number');
    return signum(thisValue, otherValue);
  },
  toBytesSink(sink) {
    sink.put(this.toBytes());
  },
  toBytes() {
    return serializeUIntN(this.val, this.constructor.width);
  }
});

module.exports = {
  UInt
};
