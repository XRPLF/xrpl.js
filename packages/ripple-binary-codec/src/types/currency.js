'use strict';

const _ = require('lodash');
const makeClass = require('../utils/make-class');
const {slice} = require('../utils/bytes-utils');
const {Hash160} = require('./hash-160');
const ISO_REGEX = /^[A-Z0-9]{3}$/;
const HEX_REGEX = /^[A-F0-9]{40}$/;

function isoToBytes(iso) {
  const bytes = new Uint8Array(20);
  if (iso !== 'XRP') {
    const isoBytes = iso.split('').map(c => c.charCodeAt(0));
    bytes.set(isoBytes, 12);
  }
  return bytes;
}

function isISOCode(val) {
  return val.length === 3; // ISO_REGEX.test(val);
}

function isHex(val) {
  return HEX_REGEX.test(val);
}

function isStringRepr(val) {
  return _.isString(val) && (isISOCode(val) || isHex(val));
}

function isBytesArray(val) {
  return val.length === 20;
}

function isValidRepr(val) {
  return isStringRepr(val) || isBytesArray(val);
}

function bytesFromRepr(val) {
  if (isValidRepr(val)) {
    // We assume at this point that we have an object with a length, either 3,
    // 20 or 40.
    return val.length === 3 ? isoToBytes(val) : val;
  }
  throw new Error(`Unsupported Currency repr: ${val}`);
}

const $uper = Hash160.prototype;
const Currency = makeClass({
  inherits: Hash160,
  getters: ['isNative', 'iso'],
  statics: {
    init() {
      this.XRP = new this(new Uint8Array(20));
    },
    from(val) {
      return val instanceof this ? val : new this(bytesFromRepr(val));
    }
  },
  Currency(bytes) {
    Hash160.call(this, bytes);
    this.classify();
  },
  classify() {
    // We only have a non null iso() property available if the currency can be
    // losslessly represented by the 3 letter iso code. If none is available a
    // hex encoding of the full 20 bytes is the canonical representation.
    let onlyISO = true;

    const bytes = this._bytes;
    const code = slice(this._bytes, 12, 15, Array);
    const iso = code.map(c => String.fromCharCode(c)).join('');

    for (let i = bytes.length - 1; i >= 0; i--) {
      if (bytes[i] !== 0 && !(i === 12 || i === 13 || i === 14)) {
        onlyISO = false;
        break;
      }
    }
    const lossLessISO = onlyISO && iso !== 'XRP' && ISO_REGEX.test(iso);
    this._isNative = onlyISO && _.isEqual(code, [0, 0, 0]);
    this._iso = this._isNative ? 'XRP' : lossLessISO ? iso : null;
  },
  toJSON() {
    if (this.iso()) {
      return this.iso();
    }
    return $uper.toJSON.call(this);
  }
});

module.exports = {
  Currency
};
