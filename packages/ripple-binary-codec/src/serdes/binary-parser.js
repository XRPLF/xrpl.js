const assert = require('assert');
const makeClass = require('../utils/make-class');
const {Field} = require('../enums');
const {slice, parseBytes} = require('../utils/bytes-utils');

const BinaryParser = makeClass({
  BinaryParser(buf) {
    this._buf = parseBytes(buf, Uint8Array);
    this._length = this._buf.length;
    this._cursor = 0;
  },
  skip(n) {
    this._cursor += n;
  },
  read(n, to = Uint8Array) {
    const start = this._cursor;
    const end = this._cursor + n;
    assert(end <= this._buf.length);
    this._cursor = end;
    return slice(this._buf, start, end, to);
  },
  readUIntN(n) {
    return this.read(n, Array).reduce((a, b) => a << 8 | b) >>> 0;
  },
  readUInt8() {
    return this._buf[this._cursor++];
  },
  readUInt16() {
    return this.readUIntN(2);
  },
  readUInt32() {
    return this.readUIntN(4);
  },
  pos() {
    return this._cursor;
  },
  size() {
    return this._buf.length;
  },
  end(customEnd) {
    const cursor = this.pos();
    return (cursor >= this._length) || (customEnd !== null &&
            cursor >= customEnd);
  },
  readVL() {
    return this.read(this.readVLLength());
  },
  readVLLength() {
    const b1 = this.readUInt8();
    if (b1 <= 192) {
      return b1;
    } else if (b1 <= 240) {
      const b2 = this.readUInt8();
      return 193 + (b1 - 193) * 256 + b2;
    } else if (b1 <= 254) {
      const b2 = this.readUInt8();
      const b3 = this.readUInt8();
      return 12481 + (b1 - 241) * 65536 + b2 * 256 + b3;
    }
    throw new Error('Invalid varint length indicator');
  },
  readFieldOrdinal() {
    const tagByte = this.readUInt8();
    const type = (tagByte & 0xF0) >>> 4 || this.readUInt8();
    const nth = tagByte & 0x0F || this.readUInt8();
    return type << 16 | nth;
  },
  readField() {
    return Field.from(this.readFieldOrdinal());
  },
  readType(type) {
    return type.fromParser(this);
  },
  typeForField(field) {
    return field.associatedType;
  },
  readFieldValue(field) {
    const kls = this.typeForField(field);
    if (!kls) {
      throw new Error(`unsupported: (${field.name}, ${field.type.name})`);
    }
    const sizeHint = field.isVLEncoded ? this.readVLLength() : null;
    const value = kls.fromParser(this, sizeHint);
    if (value === undefined) {
      throw new Error(
        `fromParser for (${field.name}, ${field.type.name}) -> undefined `);
    }
    return value;
  },
  readFieldAndValue() {
    const field = this.readField();
    return [field, this.readFieldValue(field)];
  }
});


module.exports = {
  BinaryParser
};
