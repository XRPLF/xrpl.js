
//
// Currency support
//

// XXX Internal form should be UInt160.
function Currency() {
  // Internal form: 0 = XRP. 3 letter-code.
  // XXX Internal should be 0 or hex with three letter annotation when valid.

  // Json form:
  //  '', 'XRP', '0': 0
  //  3-letter code: ...
  // XXX Should support hex, C++ doesn't currently allow it.

  this._value  = NaN;
};

// Given "USD" return the json.
Currency.json_rewrite = function (j) {
  return Currency.from_json(j).to_json();
};

Currency.from_json = function (j) {
  return j instanceof Currency ? j.clone() : new Currency().parse_json(j);
};

Currency.from_bytes = function (j) {
  return j instanceof Currency ? j.clone() : new Currency().parse_bytes(j);
};

Currency.is_valid = function (j) {
  return Currency.from_json(j).is_valid();
};

Currency.prototype.clone = function() {
  return this.copyTo(new Currency());
};

// Returns copy.
Currency.prototype.copyTo = function (d) {
  d._value = this._value;
  return d;
};

Currency.prototype.equals = function (d) {
  var equals = (typeof this._value !== 'string' && isNaN(this._value))
    || (typeof d._value !== 'string' && isNaN(d._value));
  return equals ? false: this._value === d._value;
};

// this._value = NaN on error.
Currency.prototype.parse_json = function (j) {
  var result = NaN;

  switch (typeof j) {
    case 'string':
      if (!j || /^(0|XRP)$/.test(j)) {
        result = 0;
      } else if (/^[a-zA-Z0-9]{3}$/.test(j)) {
        result = j;
      }
      break;

    case 'number':
      if (!isNaN(j)) {
        result = j;
      }
      break;

    case 'object':
      if (j instanceof Currency) {
        result = j.copyTo({})._value;
      }
      break;
  }

  this._value = result;

  return this;
};

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

Currency.prototype.is_native = function () {
  return !isNaN(this._value) && !this._value;
};

Currency.prototype.is_valid = function () {
  return typeof this._value === 'string' || !isNaN(this._value);
};

Currency.prototype.to_json = function () {
  return this._value ? this._value : "XRP";
};

Currency.prototype.to_human = function () {
  return this._value ? this._value : "XRP";
};

exports.Currency = Currency;

// vim:sw=2:sts=2:ts=8:et
