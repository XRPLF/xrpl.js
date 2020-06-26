import * as assert from "assert";
import { makeClass } from "../utils/make-class";
import { Comparable, SerializedType } from "./serialized-type";
import { compareBytes, parseBytes } from "../utils/bytes-utils";

const Hash = makeClass(
  {
    Hash(bytes) {
      const width = this.constructor.width;
      this._bytes = bytes
        ? parseBytes(bytes, Uint8Array)
        : new Uint8Array(width);
      assert.equal(this._bytes.length, width);
    },
    mixins: [Comparable, SerializedType],
    statics: {
      width: NaN,
      from(value) {
        if (value instanceof this) {
          return value;
        }
        return new this(parseBytes(value));
      },
      fromParser(parser, hint) {
        return new this(parser.read(hint || this.width));
      },
    },
    compareTo(other) {
      return compareBytes(this._bytes, this.constructor.from(other)._bytes);
    },
    toString() {
      return this.toHex();
    },
    nibblet(depth) {
      const byteIx = depth > 0 ? (depth / 2) | 0 : 0;
      let b = this._bytes[byteIx];
      if (depth % 2 === 0) {
        b = (b & 0xf0) >>> 4;
      } else {
        b = b & 0x0f;
      }
      return b;
    },
  },
  undefined
);

export { Hash };
