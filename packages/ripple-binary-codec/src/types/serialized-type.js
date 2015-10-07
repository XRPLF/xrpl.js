'use strict';

const {bytesToHex, slice} = require('../utils/bytes-utils');
const {BytesList} = require('../serdes/binary-serializer');

const Comparable = {
  lt(other) {
    return this.compareTo(other) < 0;
  },
  eq(other) {
    return this.compareTo(other) === 0;
  },
  gt(other) {
    return this.compareTo(other) > 0;
  },
  gte(other) {
    return this.compareTo(other) > -1;
  },
  lte(other) {
    return this.compareTo(other) < 1;
  }
};

const SerializedType = {
  toBytesSink(sink) {
    sink.put(this._bytes);
  },
  toHex() {
    return bytesToHex(this.toBytes());
  },
  toBytes() {
    if (this._bytes) {
      return slice(this._bytes);
    }
    const bl = new BytesList();
    this.toBytesSink(bl);
    return bl.toBytes();
  },
  toJSON() {
    return this.toHex();
  },
  toString() {
    return this.toHex();
  }
};

function ensureArrayLikeIs(Type, arrayLike) {
  return {
    withChildren(Child) {
      if (arrayLike instanceof Type) {
        return arrayLike;
      }
      const obj = new Type();
      for (let i = 0; i < arrayLike.length; i++) {
        obj.push(Child.from(arrayLike[i]));
      }
      return obj;
    }
  };
}

module.exports = {
  ensureArrayLikeIs,
  SerializedType,
  Comparable
};
