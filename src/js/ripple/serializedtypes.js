/**
 * Type definitions for binary format.
 *
 * This file should not be included directly. Instead, find the format you're
 * trying to parse or serialize in binformat.js and pass that to
 * SerializedObject.parse() or SerializedObject.serialize().
 */

var extend  = require('extend'),
    utils   = require('./utils'),
    sjcl    = require('../../../build/sjcl');

var amount  = require('./amount'),
    UInt128 = require('./uint128').UInt128,
    UInt160 = require('./uint160').UInt160,
    UInt256 = require('./uint256').UInt256,
    Amount  = amount.Amount,
    Currency= amount.Currency;

// Shortcuts
var hex    = sjcl.codec.hex,
    bytes  = sjcl.codec.bytes;

var jsbn    = require('./jsbn');
var BigInteger = jsbn.BigInteger;


var SerializedType = function (methods) {
  extend(this, methods);
};

function serialize_hex(so, hexData, noLength) {
  var byteData = bytes.fromBits(hex.toBits(hexData));
  if (!noLength) {
    SerializedType.serialize_varint(so, byteData.length);
  }
  so.append(byteData);
};



/**
 * parses bytes as hex
 */
function convert_bytes_to_hex (byte_array) {
  return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(byte_array));
}

SerializedType.serialize_varint = function (so, val) {
  if (val < 0) {
    throw new Error("Variable integers are unsigned.");
  }
  if (val <= 192) {
    so.append([val]);
  } else if (val <= 12,480) {
    val -= 193;
    so.append([193 + (val >>> 8), val & 0xff]);
  } else if (val <= 918744) {
    val -= 12481;
    so.append([
      241 + (val >>> 16),
      val >>> 8 & 0xff,
      val & 0xff
    ]);
  } else throw new Error("Variable integer overflow.");
};


SerializedType.parse_varint = function (so) {
  var b1 = so.read(1)[0], b2, b3;
  if (b1 <= 192) {
    return b1;
  } else if (b1 <= 240) {
    b2 = so.read(1)[0];
    return 193 + (b1-193)*256 + b2;
  } else if (b1 <= 254) {
    b2 = so.read(1)[0];
    b3 = so.read(1)[0];
    return 12481 + (b1-241)*65536 + b2*256 + b3
  }
  else {
    throw new Error("Invalid varint length indicator");
  }
};

// In the following, we assume that the inputs are in the proper range. Is this correct?

// Helper functions for 1-, 2-, and 4-byte integers.

/**
 * Convert an integer value into an array of bytes.
 *
 * The result is appended to the serialized object ("so").
 */
function append_byte_array(so, val, bytes) {
  if ("number" !== typeof val) {
    throw new Error("Integer is not a number");
  }
  if (val < 0 || val >= (Math.pow(256, bytes))) {
    throw new Error("Integer out of bounds");
  }
  var newBytes = [];
  for (var i=0; i<bytes; i++) {
    newBytes.unshift(val >>> (i*8) & 0xff);
  }
  so.append(newBytes);
}

// Convert a certain number of bytes from the serialized object ("so") into an integer.
function readAndSum(so, bytes) {
  var sum = 0;
  for (var i = 0; i<bytes; i++) {
    sum += (so.read(1)[0] << (8*(bytes-1-i)) );
  }
  return sum;
}


var STInt8 = exports.Int8 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 1);
  },
  parse: function (so) {
    return readAndSum(so, 1);
  }
});

var STInt16 = exports.Int16 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 2);
    /*so.append([
     val >>> 8 & 0xff,
     val       & 0xff
     ]);*/
  },
  parse: function (so) {
    return readAndSum(so, 2);
  }
});

var STInt32 = exports.Int32 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 4)
    /*so.append([
     val >>> 24 & 0xff,
     val >>> 16 & 0xff,
     val >>>  8 & 0xff,
     val        & 0xff
     ]);*/
  },
  parse: function (so) {
    return readAndSum(so, 4);
  }
});


var STInt64 = exports.Int64 = new SerializedType({
  serialize: function (so, val) {
    var bigNumObject;
    if ("number" === typeof val) {
      val = Math.floor(val);
      if (val < 0) {
        throw new Error("Negative value for unsigned Int64 is invalid.");
      }
      bigNumObject = new BigInteger(""+val, 10);
    } else if ("string" === typeof val) {
      if (!/^[0-9A-F]{0,16}$/i.test(val)) {
        throw new Error("Not a valid hex Int64.");
      }
      bigNumObject = new BigInteger(val, 16);
    } else if (val instanceof BigInteger) {
      if (val.compareTo(BigInteger.ZERO) < 0) {
        throw new Error("Negative value for unsigned Int64 is invalid.");
      }
      bigNumObject = val;
    } else {
      throw new Error("Invalid type for Int64");
    }

    var hex = bigNumObject.toString(16);
    if (hex.length > 16) {
      throw new Error("Int64 is too large");
    }
    while (hex.length < 16) {
      hex = "0" + hex;
    }
    return serialize_hex(so, hex, true); //noLength = true
  },
  parse: function (so) {
    var hi = readAndSum(so, 4);
    var lo = readAndSum(so, 4);

    var result = new BigInteger(hi);
    result.shiftLeft(32);
    result.add(lo);
    return result;
  }
});

var STHash128 = exports.Hash128 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt128.from_json(val);
    if (!hash.is_valid()) {
      throw new Error("Invalid Hash128");
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt128.from_bytes(so.read(16));
  }
});

var STHash256 = exports.Hash256 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt256.from_json(val);
    if (!hash.is_valid()) {
      throw new Error("Invalid Hash256");
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt256.from_bytes(so.read(32));
  }
});

var STHash160 = exports.Hash160 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt160.from_json(val);
    if (!hash.is_valid()) {
      throw new Error("Invalid Hash160");
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt160.from_bytes(so.read(20));
  }
});

// Internal
var STCurrency = new SerializedType({
  serialize: function (so, val) {
    var currency = val.to_json();
    if ("XRP" === currency) {
      serialize_hex(so, UInt160.HEX_ZERO, true);
    } else if ("string" === typeof currency && currency.length === 3) {
      var currencyCode = currency.toUpperCase(),
          currencyData = utils.arraySet(20, 0);

      if (!/^[A-Z]{3}$/.test(currencyCode) || currencyCode === "XRP" ) {
        throw new Error('Invalid currency code');
      }

      currencyData[12] = currencyCode.charCodeAt(0) & 0xff;
      currencyData[13] = currencyCode.charCodeAt(1) & 0xff;
      currencyData[14] = currencyCode.charCodeAt(2) & 0xff;

      so.append(currencyData);
    } else {
      throw new Error('Tried to serialize invalid/unimplemented currency type.');
    }
  },
  parse: function (so) {
    var currency = Currency.from_bytes(so.read(20));
    if (!currency.is_valid()) {
      throw new Error("Invalid currency");
    }
    return currency;
  }
});

var STAmount = exports.Amount = new SerializedType({
  serialize: function (so, val) {
    var amount = Amount.from_json(val);
    if (!amount.is_valid()) {
      throw new Error("Not a valid Amount object.");
    }

    // Amount (64-bit integer)
    var valueBytes = utils.arraySet(8, 0);
    if (amount.is_native()) {
      var valueHex = amount._value.toString(16);

      // Enforce correct length (64 bits)
      if (valueHex.length > 16) {
        throw new Error('Value out of bounds');
      }
      while (valueHex.length < 16) {
        valueHex = "0" + valueHex;
      }

      valueBytes = bytes.fromBits(hex.toBits(valueHex));
      // Clear most significant two bits - these bits should already be 0 if
      // Amount enforces the range correctly, but we'll clear them anyway just
      // so this code can make certain guarantees about the encoded value.
      valueBytes[0] &= 0x3f;
      if (!amount.is_negative()) valueBytes[0] |= 0x40;
    } else {
      var hi = 0, lo = 0;

      // First bit: non-native
      hi |= 1 << 31;

      if (!amount.is_zero()) {
        // Second bit: non-negative?
        if (!amount.is_negative()) hi |= 1 << 30;

        // Next eight bits: offset/exponent
        hi |= ((97 + amount._offset) & 0xff) << 22;

        // Remaining 52 bits: mantissa
        hi |= amount._value.shiftRight(32).intValue() & 0x3fffff;
        lo = amount._value.intValue() & 0xffffffff;
      }

      valueBytes = sjcl.codec.bytes.fromBits([hi, lo]);
    }

    so.append(valueBytes);

    if (!amount.is_native()) {
      // Currency (160-bit hash)
      var currency = amount.currency();
      STCurrency.serialize(so, currency);

      // Issuer (160-bit hash)
      so.append(amount.issuer().to_bytes());
    }
  },
  parse: function (so) {
    var amount = new Amount();
    var value_bytes = so.read(8);
    var is_zero = !(value_bytes[0] & 0x7f);
    for (var i=1; i<8; i++) {
      is_zero = is_zero && !value_bytes[i];
    }
    if (value_bytes[0] & 0x80) {
      //non-native
      var currency = STCurrency.parse(so);
      var issuer_bytes = so.read(20);
      var issuer = UInt160.from_bytes(issuer_bytes);

      var offset = ((value_bytes[0] & 0x3f) << 2) + (value_bytes[1] >>> 6) - 97;
      var mantissa_bytes = value_bytes.slice(1);
      mantissa_bytes[0] &= 0x3f;
      var value = new BigInteger(mantissa_bytes, 256);

      if (value.equals(BigInteger.ZERO) && !is_zero ) {
        throw new Error("Invalid zero representation");
      }

      amount._value = value;
      amount._offset = offset;
      amount._currency    = currency;
      amount._issuer      = issuer;
      amount._is_native   = false;

    } else {
      //native
      var integer_bytes = value_bytes.slice();
      integer_bytes[0] &= 0x3f;
      amount._value = new BigInteger(integer_bytes, 256);
      amount._is_native   = true;
    }
    amount._is_negative = !is_zero && !(value_bytes[0] & 0x40);
    return amount;
  }
});

var STVL = exports.VariableLength = new SerializedType({
  serialize: function (so, val) {
    if ("string" === typeof val) serialize_hex(so, val);
    else throw new Error("Unknown datatype.");
  },
  parse: function (so) {
    var len = this.parse_varint(so);
    return convert_bytes_to_hex(so.read(len));
  }
});

var STAccount = exports.Account = new SerializedType({
  serialize: function (so, val) {
    var account = UInt160.from_json(val);
    serialize_hex(so, account.to_hex());
  },
  parse: function (so) {
    var len = this.parse_varint(so);
    if (len !== 20) {
      throw new Error("Non-standard-length account ID");
    }
    var result = UInt160.from_bytes(so.read(len));
    if (!result.is_valid()) {
      throw new Error("Invalid Account");
    }
    return result;
  }
});

var STPathSet = exports.PathSet = new SerializedType({
  typeBoundary: 0xff,
  typeEnd: 0x00,
  typeAccount: 0x01,
  typeCurrency: 0x10,
  typeIssuer: 0x20,
  serialize: function (so, val) {
    // XXX
    for (var i = 0, l = val.length; i < l; i++) {
      // Boundary
      if (i) STInt8.serialize(so, this.typeBoundary);

      for (var j = 0, l2 = val[i].length; j < l2; j++) {
        var entry = val[i][j];

        var type = 0;

        if (entry.account) type |= this.typeAccount;
        if (entry.currency) type |= this.typeCurrency;
        if (entry.issuer) type |= this.typeIssuer;

        STInt8.serialize(so, type);

        if (entry.account) {
          so.append(UInt160.from_json(entry.account).to_bytes());
        }
        if (entry.currency) {
          var currency = Currency.from_json(entry.currency);
          STCurrency.serialize(so, currency);
        }
        if (entry.issuer) {
          so.append(UInt160.from_json(entry.issuer).to_bytes());
        }
      }
    }
    STInt8.serialize(so, this.typeEnd);
  },
  parse: function (so) {
    // XXX
    throw new Error("Parsing PathSet not implemented");
  }
});

var STVector256 = exports.Vector256 = new SerializedType({
  serialize: function (so, val) {
    // XXX
    throw new Error("Serializing Vector256 not implemented");
  },
  parse: function (so) {
    // XXX
    throw new Error("Parsing Vector256 not implemented");
  }
});

var STObject = exports.Object = new SerializedType({
  serialize: function (so, val) {
    // XXX
    throw new Error("Serializing Object not implemented");
  },
  parse: function (so) {
    // XXX
    throw new Error("Parsing Object not implemented");
  }
});

var STArray = exports.Array = new SerializedType({
  serialize: function (so, val) {
    // XXX
    throw new Error("Serializing Array not implemented");
  },
  parse: function (so) {
    // XXX
    throw new Error("Parsing Array not implemented");
  }
});
