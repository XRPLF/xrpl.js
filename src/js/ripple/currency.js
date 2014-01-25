
var extend    = require('extend');

var UInt160 = require('./uint160').UInt160;
var Float = require('./float').Float;
var utils = require('./utils');

//
// Currency support
//

var Currency = extend(function () {
  // Internal form: 0 = XRP. 3 letter-code.
  // XXX Internal should be 0 or hex with three letter annotation when valid.

  // Json form:
  //  '', 'XRP', '0': 0
  //  3-letter code: ...
  // XXX Should support hex, C++ doesn't currently allow it.

  this._value  = NaN;

  this._update();
}, UInt160);

Currency.prototype = extend({}, UInt160.prototype);
Currency.prototype.constructor = Currency;

Currency.HEX_CURRENCY_BAD = "0000000000000000000000005852500000000000";

Currency.from_json = function (j, shouldInterpretXrpAsIou) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_json(j, shouldInterpretXrpAsIou);
  }
};

// this._value = NaN on error.
Currency.prototype.parse_json = function (j, shouldInterpretXrpAsIou) {
  this._value = NaN;

  switch (typeof j) {
    case 'string':
      if (!j || /^(0|XRP)$/.test(j)) {
        if (shouldInterpretXrpAsIou) {
          this.parse_hex(Currency.HEX_CURRENCY_BAD);
        } else {
          this.parse_hex(Currency.HEX_ZERO);
        }
      } else if (/^[a-zA-Z0-9]{3}$/.test(j)) {
        var currencyCode = j.toUpperCase();
        var currencyData = utils.arraySet(20, 0);
        currencyData[12] = currencyCode.charCodeAt(0) & 0xff;
        currencyData[13] = currencyCode.charCodeAt(1) & 0xff;
        currencyData[14] = currencyCode.charCodeAt(2) & 0xff;
        this.parse_bytes(currencyData);
      } else {
        this.parse_hex(j);
      }
      break;

    case 'number':
      if (!isNaN(j)) {
        this.parse_number(j);
      }
      break;

    case 'object':
      if (j instanceof Currency) {
        this._value = j.copyTo({})._value;
        this._update();
      }
      break;
  }

  return this;
};

/**
 * Recalculate internal representation.
 *
 * You should never need to call this.
 */
Currency.prototype._update = function () {
  var bytes = this.to_bytes();

  // is it 0 everywhere except 12, 13, 14?
  var isZeroExceptInStandardPositions = true;

  if (!bytes) {
    return "XRP";
  }

  this._native = false;
  this._type = -1;
  this._interest_start = new Date();
  this._interest_period = NaN;
  this._iso_code = '';

  for (var i=0; i<20; i++) {
    isZeroExceptInStandardPositions = isZeroExceptInStandardPositions && (i===12 || i===13 || i===14 || bytes[i]===0);
  }

  if (isZeroExceptInStandardPositions) {
    this._iso_code = String.fromCharCode(bytes[12])
                   + String.fromCharCode(bytes[13])
                   + String.fromCharCode(bytes[14]);

    if (this._iso_code === "\0\0\0") {
      this._native = true;
      this._iso_code = "XRP";
    }

    this._type = 0;
  } else if (bytes[0] === 0x01) { // Demurrage currency
    this._iso_code = String.fromCharCode(bytes[1])
                   + String.fromCharCode(bytes[2])
                   + String.fromCharCode(bytes[3]);

    this._type = 1;
    this._interest_start = (bytes[4] << 24) +
                           (bytes[5] << 16) +
                           (bytes[6] <<  8) +
                           (bytes[7]      );
    this._interest_period = Float.fromBytes(bytes.slice(8, 16));
  }
};

// XXX Probably not needed anymore?
/*
Currency.prototype.parse_bytes = function (byte_array) {
  if (Array.isArray(byte_array) && byte_array.length === 20) {
    var result;
    // is it 0 everywhere except 12, 13, 14?
    var isZeroExceptInStandardPositions = true;

    for (var i=0; i<20; i++) {
      isZeroExceptInStandardPositions = isZeroExceptInStandardPositions && (i===12 || i===13 || i===14 || byte_array[0]===0)
    }

    if (isZeroExceptInStandardPositions) {
      var currencyCode = String.fromCharCode(byte_array[12])
      + String.fromCharCode(byte_array[13])
      + String.fromCharCode(byte_array[14]);
      if (/^[A-Z0-9]{3}$/.test(currencyCode) && currencyCode !== "XRP" ) {
        this._value = currencyCode;
      } else if (currencyCode === "\0\0\0") {
        this._value = 0;
      } else {
        this._value = NaN;
      }
    } else {
      // XXX Should support non-standard currency codes
      this._value = NaN;
    }
  } else {
    this._value = NaN;
  }
  return this;
};
*/

Currency.prototype.is_native = function () {
  return this._native;
};

/**
 * Whether this currency is an interest-bearing/demurring currency.
 */
Currency.prototype.has_interest = function () {
  return this._type === 1 && this._interest_start && !isNaN(this._interest_period);
};

Currency.prototype.get_interest_at = function (referenceDate) {
  if (!this.has_interest) return 1;

  if (referenceDate instanceof Date) {
    referenceDate = utils.fromTimestamp(referenceDate.getTime());
  }

  return Math.pow(Math.E, (referenceDate - this._interest_start) / this._interest_period);
};

// XXX Currently we inherit UInt.prototype.is_valid, which is mostly fine.
//
//     We could be doing further checks into the internal format of the
//     currency data, since there are some values that are invalid.
//
//Currency.prototype.is_valid = function () {
//  return this._value instanceof BigInteger && ...;
//};

Currency.prototype.to_json = function () {
  if (!this.is_valid()) {
    // XXX This backwards compatible behavior, but probably not very good.
    return "XRP";
  }

  if (/^[A-Z0-9]{3}$/.test(this._iso_code)) {
    return this._iso_code;
  }

  // Fallback to returning the raw currency hex
  var currencyHex = this.to_hex();

  // XXX This is to maintain backwards compatibility, but it is very, very odd
  //     behavior, so we should deprecate it and get rid of it as soon as
  //     possible.
  if (currencyHex === Currency.HEX_ONE) {
    return 1;
  }

  return currencyHex;
};

Currency.prototype.to_human = function () {
  return this.to_json();
};

exports.Currency = Currency;

// vim:sw=2:sts=2:ts=8:et
