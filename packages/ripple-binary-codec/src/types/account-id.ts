import { makeClass } from "../utils/make-class";
const { decodeAccountID, encodeAccountID } = require("ripple-address-codec");
const { Hash160 } = require("./hash-160");

const AccountID = makeClass(
  {
    AccountID(bytes) {
      Hash160.call(this, bytes);
    },
    inherits: Hash160,
    statics: {
      from(value) {
        return value instanceof this
          ? value
          : /^r/.test(value)
          ? this.fromBase58(value)
          : new this(value);
      },
      cache: {},
      fromCache(base58) {
        let cached = this.cache[base58];
        if (!cached) {
          cached = this.cache[base58] = this.fromBase58(base58);
        }
        return cached;
      },
      fromBase58(value) {
        const acc = new this(decodeAccountID(value));
        acc._toBase58 = value;
        return acc;
      },
    },
    toJSON() {
      return this.toBase58();
    },
    cached: {
      toBase58() {
        return encodeAccountID(this._bytes);
      },
    },
  },
  undefined
);

export { AccountID };
