'use strict';
const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const BN = require('bn.js');

function Currency() {
  // Internal form: 0 = XRP. 3 letter-code.
  // XXX Internal should be 0 or hex with three letter annotation when valid.

  // Json form:
  //  '', 'XRP', '0': 0
  //  3-letter code: ...
  // XXX Should support hex, C++ doesn't currently allow it.

  this._value = NaN;
  this._update();
}

Currency.width = 20;
Currency.HEX_CURRENCY_BAD = '0000000000000000000000005852500000000000';
Currency.HEX_ZERO = '0000000000000000000000000000000000000000';
Currency.HEX_ONE = '0000000000000000000000000000000000000001';

Currency.from_json = function(j, shouldInterpretXrpAsIou) {
  return (new Currency()).parse_json(j, shouldInterpretXrpAsIou);
};

Currency.from_hex = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_hex(j);
};

Currency.from_bytes = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_bytes(j);
};

Currency.prototype.to_hex = function() {
  if (!this.is_valid()) {
    return null;
  }

  return utils.arrayToHex(this.to_bytes());
};

Currency.json_rewrite = function(j, opts) {
  return this.from_json(j).to_json(opts);
};

Currency.prototype.clone = function() {
  return this.copyTo(new this.constructor());
};

Currency.prototype.equals = function(o) {
  return this.is_valid() &&
         o.is_valid() &&
         // This throws but the expression will short circuit
         this.cmp(o) === 0;
};

Currency.prototype.cmp = function(o) {
  assert(this.is_valid() && o.is_valid());
  return this._value.cmp(o._value);
};

// this._value = NaN on error.
Currency.prototype.parse_json = function(j, shouldInterpretXrpAsIou) {
  this._value = NaN;

  if (j instanceof Currency) {
    this._value = j._value;
    this._update();
    return this;
  }

  switch (typeof j) {
    case 'number':
      if (!isNaN(j)) {
        this.parse_number(j);
      }
      break;
    case 'string':
      if (!j || j === '0' || j === 'XRP') {
        // Empty string or XRP
        this.parse_hex(shouldInterpretXrpAsIou
          ? Currency.HEX_CURRENCY_BAD
          : Currency.HEX_ZERO);
        break;
      }

      if (j === '1') {
        // 'no currency'
        this.parse_hex(Currency.HEX_ONE);
        break;
      }

      if (/^[A-F0-9]{40}$/.test(j)) {
        // Hex format
        this.parse_hex(j);
        break;
      }

      const currencyCode = j.toUpperCase();
      const currencyData = utils.arraySet(20, 0);
      currencyData[12] = currencyCode.charCodeAt(0) & 0xff;
      currencyData[13] = currencyCode.charCodeAt(1) & 0xff;
      currencyData[14] = currencyCode.charCodeAt(2) & 0xff;
      this.parse_bytes(currencyData);
      break;
    case 'undefined':
      this.parse_hex(Currency.HEX_ZERO);
      break;
  }

  this._update();
  return this;
};

Currency.prototype.is_valid = function() {
  return this._value instanceof BN;
};

Currency.prototype.parse_number = function(j) {
  this._value = NaN;

  if (typeof j === 'number' && isFinite(j) && j >= 0) {
    this._value = new BN(j);
  }

  this._update();
  return this;
};

Currency.prototype.parse_hex = function(j) {
  if (new RegExp(`^[0-9A-Fa-f]{${this.constructor.width * 2}}$`).test(j)) {
    this._value = new BN(j, 16);
  } else {
    this._value = NaN;
  }

  this._update();
  return this;
};

Currency.prototype.to_bytes = function() {
  if (!this.is_valid()) {
    return null;
  }

  return this._value.toArray('be', this.constructor.width);
};

Currency.prototype._isISOCode = function() {
  return _.every(this.to_bytes(), (octet, i) =>
    octet === 0 || (i >= 12 && i <= 14))
    && /^[A-Z0-9]{3}$/.test(this._iso_code);
};

/**
 * Recalculate internal representation.
 *
 * You should never need to call this.
 */

Currency.prototype._update = function() {
  const bytes = this.to_bytes();

  // is it 0 everywhere except 12, 13, 14?
  let isZeroExceptInStandardPositions = true;

  if (!bytes) {
    return; // before being initialized
  }

  this._native = false;
  this._type = -1;
  this._iso_code = '';

  for (let i = 0; i < 20; i++) {
    isZeroExceptInStandardPositions = isZeroExceptInStandardPositions
    && (i === 12 || i === 13 || i === 14 || bytes[i] === 0);
  }

  if (isZeroExceptInStandardPositions) {
    this._iso_code = String.fromCharCode(bytes[12])
                   + String.fromCharCode(bytes[13])
                   + String.fromCharCode(bytes[14]);

    if (this._iso_code === '\u0000\u0000\u0000') {
      this._native = true;
      this._iso_code = 'XRP';
    }

    this._type = 0;
  } else if (bytes[0] === 0x01) { // Demurrage currency
    this._iso_code = String.fromCharCode(bytes[1])
                   + String.fromCharCode(bytes[2])
                   + String.fromCharCode(bytes[3]);

    this._type = 1;
  }
};

/**
 * Returns copy.
 *
 * This copies code from UInt.copyTo so we do not call _update,
 * bvecause to_bytes is very expensive.
 */

Currency.prototype.copyTo = function(d) {
  d._value = this._value;

  if (this._version_byte !== undefined) {
    d._version_byte = this._version_byte;
  }

  if (!d.is_valid()) {
    return d;
  }

  d._native = this._native;
  d._type = this._type;
  d._iso_code = this._iso_code;

  return d;
};

Currency.prototype.parse_bytes = function(j) {
  if (Array.isArray(j) && j.length === this.constructor.width) {
    this._value = new BN(j);
  } else {
    this._value = NaN;
  }

  this._update();
  return this;
};

Currency.prototype.is_native = function() {
  return this._native;
};

Currency.prototype.to_json = function(opts = {}) {
  if (!this.is_valid()) {
    throw new Error('Invalid currency object');
  }

  if (this._isISOCode() && !opts.force_hex) {
    const fullName = opts && opts.full_name ? ' - ' + opts.full_name : '';
    return this._iso_code + fullName;
  }

  const hex = this.to_hex();

  // XXX This is to maintain backwards compatibility, but it is very, very
  // odd behavior, so we should deprecate it and get rid of it as soon as
  // possible.
  return hex === Currency.HEX_ONE ? 1 : hex;
};

Currency.prototype.get_iso = function() {
  return this._iso_code;
};

Currency.is_valid = function(j) {
  return this.from_json(j).is_valid();
};

exports.Currency = Currency;
