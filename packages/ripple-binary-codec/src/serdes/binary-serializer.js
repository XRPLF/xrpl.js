const assert = require('assert');
const {parseBytes, bytesToHex} = require('../utils/bytes-utils');
const makeClass = require('../utils/make-class');
const {Type, Field} = require('../enums');

const BytesSink = {
  put(/* bytesSequence */) {
    // any hex string or any object with a `length` and where 0 <= [ix] <= 255
  }
};

const BytesList = makeClass({
  implementing: BytesSink,
  BytesList() {
    this.arrays = [];
    this.length = 0;
  },
  put(bytesArg) {
    const bytes = parseBytes(bytesArg, Uint8Array);
    this.length += bytes.length;
    this.arrays.push(bytes);
    return this;
  },
  toBytesSink(sink) {
    this.arrays.forEach(arr => {
      sink.put(arr);
    });
  },
  toBytes() {
    const concatenated = new Uint8Array(this.length);
    let pointer = 0;
    this.arrays.forEach(arr => {
      concatenated.set(arr, pointer);
      pointer += arr.length;
    });
    return concatenated;
  },
  toHex() {
    return bytesToHex(this.toBytes());
  }
});

const BinarySerializer = makeClass({
  BinarySerializer(sink) {
    this.sink = sink;
  },
  write(value) {
    value.toBytesSink(this.sink);
  },
  put(bytes) {
    this.sink.put(bytes);
  },
  writeType(type, value) {
    this.write(type.from(value));
  },
  writeBytesList(bl) {
    bl.toBytesSink(this.sink);
  },
  encodeVL(len) {
    let length = len;
    const lenBytes = new Uint8Array(4);
    if (length <= 192) {
      lenBytes[0] = length;
      return lenBytes.subarray(0, 1);
    } else if (length <= 12480) {
      length -= 193;
      lenBytes[0] = 193 + (length >>> 8);
      lenBytes[1] = length & 0xff;
      return lenBytes.subarray(0, 2);
    } else if (length <= 918744) {
      length -= 12481;
      lenBytes[0] = 241 + (length >>> 16);
      lenBytes[1] = (length >> 8) & 0xff;
      lenBytes[2] = length & 0xff;
      return lenBytes.subarray(0, 3);
    }
    throw new Error('Overflow error');
  },
  writeFieldAndValue(field, _value) {
    const sink = this.sink;
    const value = field.associatedType.from(_value);
    assert(value.toBytesSink, field);
    sink.put(field.bytes);

    if (field.isVLEncoded) {
      this.writeLengthEncoded(value);
    } else {
      value.toBytesSink(sink);
      if (field.type === Type.STObject) {
        sink.put(Field.ObjectEndMarker.bytes);
      } else if (field.type === Type.STArray) {
        sink.put(Field.ArrayEndMarker.bytes);
      }
    }
  },
  writeLengthEncoded(value) {
    const bytes = new BytesList();
    value.toBytesSink(bytes);
    this.put(this.encodeVL(bytes.length));
    this.writeBytesList(bytes);
  }
});

module.exports = {
  BytesList,
  BinarySerializer
};
