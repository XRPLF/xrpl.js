var utils   = require('./utils');
var sjcl    = utils.sjcl;
var config  = require('./config');

var BigInteger = utils.jsbn.BigInteger;

//
// Abstract UInt class
//
// Base class for UInt classes
//

var UInt = function() {
  // Internal form: NaN or BigInteger
  this._value  = NaN;

  this._update();
};

UInt.json_rewrite = function(j, opts) {
  return this.from_json(j).to_json(opts);
};

// Return a new UInt from j.
UInt.from_generic = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_generic(j);
  }
};

// Return a new UInt from j.
UInt.from_hex = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_hex(j);
  }
};

// Return a new UInt from j.
UInt.from_json = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_json(j);
  }
};

// Return a new UInt from j.
UInt.from_bits = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_bits(j);
  }
};

// Return a new UInt from j.
UInt.from_bytes = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_bytes(j);
  }
};

// Return a new UInt from j.
UInt.from_bn = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_bn(j);
  }
};

// Return a new UInt from j.
UInt.from_number = function(j) {
  if (j instanceof this) {
    return j.clone();
  } else {
    return (new this()).parse_number(j);
  }
};

UInt.is_valid = function(j) {
  return this.from_json(j).is_valid();
};

UInt.prototype.clone = function() {
  return this.copyTo(new this.constructor());
};

// Returns copy.
UInt.prototype.copyTo = function(d) {
  d._value = this._value;

  if (typeof d._update === 'function') {
    d._update();
  }

  return d;
};

UInt.prototype.equals = function(d) {
  return this._value instanceof BigInteger && d._value instanceof BigInteger && this._value.equals(d._value);
};

UInt.prototype.is_valid = function() {
  return this._value instanceof BigInteger;
};

UInt.prototype.is_zero = function() {
  return this._value.equals(BigInteger.ZERO);
};

/**
 * Update any derivative values.
 *
 * This allows subclasses to maintain caches of any data that they derive from
 * the main _value. For example, the Currency class keeps the currency type, the
 * currency code and other information about the currency cached.
 *
 * The reason for keeping this mechanism in this class is so every subclass can
 * call it whenever it modifies the internal state.
 */
UInt.prototype._update = function() {
  // Nothing to do by default. Subclasses will override this.
};

// value = NaN on error.
UInt.prototype.parse_generic = function(j) {
  // Canonicalize and validate
  if (config.accounts && (j in config.accounts)) {
    j = config.accounts[j].account;
  }

  switch (j) {
    case undefined:
      case '0':
      case this.constructor.STR_ZERO:
      case this.constructor.ACCOUNT_ZERO:
      case this.constructor.HEX_ZERO:
      this._value  = BigInteger.valueOf();
      break;

    case '1':
      case this.constructor.STR_ONE:
      case this.constructor.ACCOUNT_ONE:
      case this.constructor.HEX_ONE:
      this._value  = new BigInteger([1]);
      break;

    default:
        if (typeof j !== 'string') {
          this._value  = NaN;
        } else if (this.constructor.width === j.length) {
          this._value  = new BigInteger(utils.stringToArray(j), 256);
        } else if ((this.constructor.width * 2) === j.length) {
          // XXX Check char set!
          this._value  = new BigInteger(j, 16);
        } else {
          this._value  = NaN;
        }
  }

  this._update();

  return this;
};

UInt.prototype.parse_hex = function(j) {
  if (typeof j === 'string' && j.length === (this.constructor.width * 2)) {
    this._value = new BigInteger(j, 16);
  } else {
    this._value = NaN;
  }

  this._update();

  return this;
};

UInt.prototype.parse_bits = function(j) {
  if (sjcl.bitArray.bitLength(j) !== this.constructor.width * 8) {
    this._value = NaN;
  } else {
    var bytes = sjcl.codec.bytes.fromBits(j);
    this.parse_bytes(bytes);
  }

  this._update();

  return this;
};


UInt.prototype.parse_bytes = function(j) {
  if (!Array.isArray(j) || j.length !== this.constructor.width) {
    this._value = NaN;
  } else {
    this._value  = new BigInteger([0].concat(j), 256);
  }

  this._update();

  return this;
};


UInt.prototype.parse_json = UInt.prototype.parse_hex;

UInt.prototype.parse_bn = function(j) {
  if ((j instanceof sjcl.bn) && j.bitLength() <= this.constructor.width * 8) {
    var bytes = sjcl.codec.bytes.fromBits(j.toBits());
    this._value  = new BigInteger(bytes, 256);
  } else {
    this._value = NaN;
  }

  this._update();

  return this;
};

UInt.prototype.parse_number = function(j) {
  this._value = NaN;

  if (typeof j === 'number' && isFinite(j) && j >= 0) {
    this._value = new BigInteger(String(j));
  }

  this._update();

  return this;
};

// Convert from internal form.
UInt.prototype.to_bytes = function() {
  if (!(this._value instanceof BigInteger)) {
    return null;
  }

  var bytes  = this._value.toByteArray();

  bytes = bytes.map(function(b) {
    return (b + 256) % 256;
  });

  var target = this.constructor.width;

  // XXX Make sure only trim off leading zeros.
  bytes = bytes.slice(-target);

  while (bytes.length < target) {
    bytes.unshift(0);
  }

  return bytes;
};

UInt.prototype.to_hex = function() {
  if (!(this._value instanceof BigInteger)) {
    return null;
  }

  var bytes = this.to_bytes();
  return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(bytes)).toUpperCase();
};

UInt.prototype.to_json = UInt.prototype.to_hex;

UInt.prototype.to_bits = function() {
  if (!(this._value instanceof BigInteger)) {
    return null;
  }

  var bytes = this.to_bytes();

  return sjcl.codec.bytes.toBits(bytes);
};

UInt.prototype.to_bn = function() {
  if (!(this._value instanceof BigInteger)) {
    return null;
  }

  var bits = this.to_bits();

  return sjcl.bn.fromBits(bits);
};

exports.UInt = UInt;

// vim:sw=2:sts=2:ts=8:et
