/**
 * Type definitions for binary format.
 *
 * This file should not be included directly. Instead, find the format you're
 * trying to parse or serialize in binformat.js and pass that to
 * SerializedObject.parse() or SerializedObject.serialize().
 */

var assert    = require('assert');
var extend    = require('extend');
var binformat = require('./binformat');
var utils     = require('./utils');
var sjcl      = utils.sjcl;

var UInt128   = require('./uint128').UInt128;
var UInt160   = require('./uint160').UInt160;
var UInt256   = require('./uint256').UInt256;
var Base      = require('./base').Base;

var amount    = require('./amount');
var Amount    = amount.Amount;
var Currency  = amount.Currency;

// Shortcuts
var hex = sjcl.codec.hex;
var bytes = sjcl.codec.bytes;

var BigInteger = utils.jsbn.BigInteger;


var SerializedType = function (methods) {
  extend(this, methods);
};

function isNumber(val) {
  return typeof val === 'number' && isFinite(val);
};

function isString(val) {
  return typeof val === 'string';
};

function isHexInt64String(val) {
  return isString(val) && /^[0-9A-F]{0,16}$/i.test(val);
};

function isCurrencyString(val) {
  return isString(val) && /^[A-Z0-9]{3}$/.test(val);
};

function isBigInteger(val) {
  return val instanceof BigInteger;
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
  return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(byte_array)).toUpperCase();
};

SerializedType.serialize_varint = function (so, val) {
  if (val < 0) {
    throw new Error('Variable integers are unsigned.');
  }

  if (val <= 192) {
    so.append([val]);
  } else if (val <= 12480) {
    val -= 193;
    so.append([193 + (val >>> 8), val & 0xff]);
  } else if (val <= 918744) {
    val -= 12481;
    so.append([ 241 + (val >>> 16), val >>> 8 & 0xff, val & 0xff ]);
  } else {
    throw new Error('Variable integer overflow.');
  }
};

SerializedType.prototype.parse_varint = function (so) {
  var b1 = so.read(1)[0], b2, b3;
  var result;

  if (b1 > 254) {
    throw new Error('Invalid varint length indicator');
  }

  if (b1 <= 192) {
    result = b1;
  } else if (b1 <= 240) {
    b2 = so.read(1)[0];
    result = 193 + (b1 - 193) * 256 + b2;
  } else if (b1 <= 254) {
    b2 = so.read(1)[0];
    b3 = so.read(1)[0];
    result = 12481 + (b1 - 241) * 65536 + b2 * 256 + b3;
  }

  return result;
};

// In the following, we assume that the inputs are in the proper range. Is this correct?
// Helper functions for 1-, 2-, and 4-byte integers.

/**
 * Convert an integer value into an array of bytes.
 *
 * The result is appended to the serialized object ('so').
 */
function append_byte_array(so, val, bytes) {
  if (!isNumber(val)) {
    throw new Error('Value is not a number', bytes);
  }

  if (val < 0 || val >= Math.pow(256, bytes)) {
    throw new Error('Value out of bounds');
  }

  var newBytes = [ ];

  for (var i=0; i<bytes; i++) {
    newBytes.unshift(val >>> (i * 8) & 0xff);
  }

  so.append(newBytes);
};

// Convert a certain number of bytes from the serialized object ('so') into an integer.
function readAndSum(so, bytes) {
  var sum = 0;

  if (bytes > 4) {
    throw new Error('This function only supports up to four bytes.');
  }

  for (var i=0; i<bytes; i++) {
    var byte = so.read(1)[0];
    sum += (byte << (8 * (bytes - i - 1)));
  }

  // Convert to unsigned integer
  return sum >>> 0;
};

var STInt8 = exports.Int8 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 1);
  },
  parse: function (so) {
    return readAndSum(so, 1);
  }
});

STInt8.id = 16;

var STInt16 = exports.Int16 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 2);
  },
  parse: function (so) {
    return readAndSum(so, 2);
  }
});

STInt16.id = 1;

var STInt32 = exports.Int32 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 4);
  },
  parse: function (so) {
    return readAndSum(so, 4);
  }
});

STInt32.id = 2;

var STInt64 = exports.Int64 = new SerializedType({
  serialize: function (so, val) {
    var bigNumObject;

    if (isNumber(val)) {
      val = Math.floor(val);
      if (val < 0) {
        throw new Error('Negative value for unsigned Int64 is invalid.');
      }
      bigNumObject = new BigInteger(String(val), 10);
    } else if (isString(val)) {
      if (!isHexInt64String(val)) {
        throw new Error('Not a valid hex Int64.');
      }
      bigNumObject = new BigInteger(val, 16);
    } else if (isBigInteger(val)) {
      if (val.compareTo(BigInteger.ZERO) < 0) {
        throw new Error('Negative value for unsigned Int64 is invalid.');
      }
      bigNumObject = val;
    } else {
      throw new Error('Invalid type for Int64');
    }

    var hex = bigNumObject.toString(16);

    if (hex.length > 16) {
      throw new Error('Int64 is too large');
    }

    while (hex.length < 16) {
      hex = '0' + hex;
    }

    serialize_hex(so, hex, true); //noLength = true
  },
  parse: function (so) {
    var bytes = so.read(8);
    // We need to add a 0, so if the high bit is set it won't think it's a
    // pessimistic numeric fraek. What doth lief?
    var result = new BigInteger([0].concat(bytes), 256);
    assert(result instanceof BigInteger);
    return result;
  }
});

STInt64.id = 3;

var STHash128 = exports.Hash128 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt128.from_json(val);
    if (!hash.is_valid()) {
      throw new Error('Invalid Hash128');
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt128.from_bytes(so.read(16));
  }
});

STHash128.id = 4;

var STHash256 = exports.Hash256 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt256.from_json(val);
    if (!hash.is_valid()) {
      throw new Error('Invalid Hash256');
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt256.from_bytes(so.read(32));
  }
});

STHash256.id = 5;

var STHash160 = exports.Hash160 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt160.from_json(val);
    if (!hash.is_valid()) {
      throw new Error('Invalid Hash160');
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt160.from_bytes(so.read(20));
  }
});

STHash160.id = 17;

// Internal
var STCurrency = new SerializedType({
  serialize: function (so, val, xrp_as_ascii) {
    var currencyData = val.to_bytes();

    if (!currencyData) {
      throw new Error('Tried to serialize invalid/unimplemented currency type.');
    }

    so.append(currencyData);
  },
  parse: function (so) {
    var bytes = so.read(20);
    var currency = Currency.from_bytes(bytes);
    // XXX Disabled check. Theoretically, the Currency class should support any
    //     UInt160 value and consider it valid. But it doesn't, so for the
    //     deserialization to be usable, we need to allow invalid results for now.
    //if (!currency.is_valid()) {
    //  throw new Error('Invalid currency: '+convert_bytes_to_hex(bytes));
    //}
    return currency;
  }
});

var STAmount = exports.Amount = new SerializedType({
  serialize: function (so, val) {
    var amount = Amount.from_json(val);
    if (!amount.is_valid()) {
      throw new Error('Not a valid Amount object.');
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
        valueHex = '0' + valueHex;
      }

      valueBytes = bytes.fromBits(hex.toBits(valueHex));
      // Clear most significant two bits - these bits should already be 0 if
      // Amount enforces the range correctly, but we'll clear them anyway just
      // so this code can make certain guarantees about the encoded value.
      valueBytes[0] &= 0x3f;

      if (!amount.is_negative()) {
        valueBytes[0] |= 0x40;
      }
    } else {
      var hi = 0, lo = 0;

      // First bit: non-native
      hi |= 1 << 31;

      if (!amount.is_zero()) {
        // Second bit: non-negative?
        if (!amount.is_negative()) {
          hi |= 1 << 30;
        }

        // Next eight bits: offset/exponent
        hi |= ((97 + amount._offset) & 0xff) << 22;
        // Remaining 54 bits: mantissa
        hi |= amount._value.shiftRight(32).intValue() & 0x3fffff;
        lo = amount._value.intValue() & 0xffffffff;
      }

      valueBytes = sjcl.codec.bytes.fromBits([hi, lo]);
    }

    so.append(valueBytes);

    if (!amount.is_native()) {
      // Currency (160-bit hash)
      var currency = amount.currency();
      STCurrency.serialize(so, currency, true);

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
      issuer.set_version(Base.VER_ACCOUNT_ID);
      var offset = ((value_bytes[0] & 0x3f) << 2) + (value_bytes[1] >>> 6) - 97;
      var mantissa_bytes = value_bytes.slice(1);
      mantissa_bytes[0] &= 0x3f;
      var value = new BigInteger(mantissa_bytes, 256);

      if (value.equals(BigInteger.ZERO) && !is_zero ) {
        throw new Error('Invalid zero representation');
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

STAmount.id = 6;

var STVL = exports.VariableLength = exports.VL = new SerializedType({
  serialize: function (so, val) {
    if (typeof val === 'string') {
      serialize_hex(so, val);
    } else {
      throw new Error('Unknown datatype.');
    }
  },
  parse: function (so) {
    var len = this.parse_varint(so);
    return convert_bytes_to_hex(so.read(len));
  }
});

STVL.id = 7;

var STAccount = exports.Account = new SerializedType({
  serialize: function (so, val) {
    var account = UInt160.from_json(val);
    if (!account.is_valid()) {
      throw new Error('Invalid account!');
    }
    serialize_hex(so, account.to_hex());
  },
  parse: function (so) {
    var len = this.parse_varint(so);

    if (len !== 20) {
      throw new Error('Non-standard-length account ID');
    }

    var result = UInt160.from_bytes(so.read(len));
    result.set_version(Base.VER_ACCOUNT_ID);

    //console.log('PARSED 160:', result.to_json());
    if (false && !result.is_valid()) {
      throw new Error('Invalid Account');
    }

    return result;
  }
});

STAccount.id = 8;

var STPathSet = exports.PathSet = new SerializedType({
  typeBoundary:  0xff,
  typeEnd:       0x00,
  typeAccount:   0x01,
  typeCurrency:  0x10,
  typeIssuer:    0x20,
  serialize: function (so, val) {
    for (var i=0, l=val.length; i<l; i++) {
      // Boundary
      if (i) {
        STInt8.serialize(so, this.typeBoundary);
      }

      for (var j=0, l2=val[i].length; j<l2; j++) {
        var entry = val[i][j];
        //if (entry.hasOwnProperty('_value')) {entry = entry._value;}
        var type = 0;

        if (entry.account) {
          type |= this.typeAccount;
        }
        if (entry.currency) {
          type |= this.typeCurrency;
        }
        if (entry.issuer) {
          type |= this.typeIssuer;
        }

        STInt8.serialize(so, type);

        if (entry.account) {
          so.append(UInt160.from_json(entry.account).to_bytes());
        }

        if (entry.currency) {
          var currency = Currency.from_json(entry.currency, entry.non_native);
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
    // should return a list of lists:
    /*
       [
       [entry, entry],
       [entry, entry, entry],
       [entry],
       []
       ]

       each entry has one or more of the following attributes: amount, currency, issuer.
       */

    var path_list    = [];
    var current_path = [];
    var tag_byte;

    while ((tag_byte = so.read(1)[0]) !== this.typeEnd) {
      //TODO: try/catch this loop, and catch when we run out of data without reaching the end of the data structure.
      //Now determine: is this an end, boundary, or entry-begin-tag?
      //console.log('Tag byte:', tag_byte);
      if (tag_byte === this.typeBoundary) {
        //console.log('Boundary');
        if (current_path) { //close the current path, if there is one,
          path_list.push(current_path);
        }
        current_path = [ ]; //and start a new one.
        continue;
      }

      //It's an entry-begin tag.
      //console.log('It's an entry-begin tag.');
      var entry = {};

      if (tag_byte & this.typeAccount) {
        //console.log('entry.account');
        /*var bta = so.read(20);
          console.log('BTA:', bta);*/
        entry.account = STHash160.parse(so);
        entry.account.set_version(Base.VER_ACCOUNT_ID);
      }
      if (tag_byte & this.typeCurrency) {
        //console.log('entry.currency');
        entry.currency = STCurrency.parse(so);
        if (entry.currency.to_json() === 'XRP' && !entry.currency.is_native()) {
          entry.non_native = true;
        }
      }
      if (tag_byte & this.typeIssuer) {
        //console.log('entry.issuer');
        entry.issuer = STHash160.parse(so);
        // Enable and set correct type of base-58 encoding
        entry.issuer.set_version(Base.VER_ACCOUNT_ID);
        //console.log('DONE WITH ISSUER!');
      }

      if (entry.account || entry.currency || entry.issuer) {
        current_path.push(entry);
      } else {
        throw new Error('Invalid path entry'); //It must have at least something in it.
      }
    }

    if (current_path) {
      //close the current path, if there is one,
      path_list.push(current_path);
    }

    return path_list;
  }
});

STPathSet.id = 18;

var STVector256 = exports.Vector256 = new SerializedType({
  serialize: function (so, val) { //Assume val is an array of STHash256 objects.
    var length_as_varint = SerializedType.serialize_varint(so, val.length * 32);
    for (var i=0, l=val.length; i<l; i++) {
      STHash256.serialize(so, val[i]);
    }
  },
  parse: function (so) {
    var length = this.parse_varint(so);
    var output = [];
    // length is number of bytes not number of Hash256
    for (var i=0; i<length / 32; i++) {
      output.push(STHash256.parse(so));
    }
    return output;
  }
});

STVector256.id = 19;

exports.serialize = exports.serialize_whatever = serialize;

function serialize(so, field_name, value) {
  //so: a byte-stream to serialize into.
  //field_name: a string for the field name ('LedgerEntryType' etc.)
  //value: the value of that field.
  var field_coordinates = binformat.fieldsInverseMap[field_name];
  var type_bits         = field_coordinates[0];
  var field_bits        = field_coordinates[1];
  var tag_byte          = (type_bits < 16 ? type_bits << 4 : 0) | (field_bits < 16 ? field_bits : 0);

  if (field_name === 'LedgerEntryType' && 'string' === typeof value) {
    value = binformat.ledger[value][0];
  }

  if (field_name === 'TransactionResult' && 'string' === typeof value) {
    value = binformat.ter[value];
  }

  STInt8.serialize(so, tag_byte);

  if (type_bits >= 16) {
    STInt8.serialize(so, type_bits);
  }

  if (field_bits >= 16) {
    STInt8.serialize(so, field_bits);
  }

  // Get the serializer class (ST...) for a field based on the type bits.
  var serialized_object_type = exports[binformat.types[type_bits]];
  //do something with val[keys] and val[keys[i]];

  try {
    serialized_object_type.serialize(so, value);
  } catch (e) {
    e.message += ' (' + field_name + ')';
    throw e;
  }
}

//Take the serialized object, figure out what type/field it is, and return the parsing of that.
exports.parse = exports.parse_whatever = parse;

function parse(so) {
  var tag_byte   = so.read(1)[0];
  var type_bits  = tag_byte >> 4;

  if (type_bits === 0) {
    type_bits = so.read(1)[0];
  }

  // Get the parser class (ST...) for a field based on the type bits.
  var type = exports[binformat.types[type_bits]];

  assert(type, 'Unknown type - header byte is 0x' + tag_byte.toString(16));

  var field_bits = tag_byte & 0x0f;
  var field_name = (field_bits === 0)
  ? field_name = binformat.fields[type_bits][so.read(1)[0]]
  : field_name = binformat.fields[type_bits][field_bits];

  assert(field_name, 'Unknown field - header byte is 0x' + tag_byte.toString(16));

  return [ field_name, type.parse(so) ]; //key, value
};

function sort_fields(keys) {
  function sort_field_compare(a, b) {
    var a_field_coordinates = binformat.fieldsInverseMap[a];
    var a_type_bits         = a_field_coordinates[0];
    var a_field_bits        = a_field_coordinates[1];
    var b_field_coordinates = binformat.fieldsInverseMap[b];
    var b_type_bits         = b_field_coordinates[0];
    var b_field_bits        = b_field_coordinates[1];

    // Sort by type id first, then by field id
    return a_type_bits !== b_type_bits ? a_type_bits - b_type_bits : a_field_bits - b_field_bits;
  };

  return keys.sort(sort_field_compare);
}

var STObject = exports.Object = new SerializedType({
  serialize: function (so, val, no_marker) {
    var keys = Object.keys(val);

    // Ignore lowercase field names - they're non-serializable fields by
    // convention.
    keys = keys.filter(function (key) {
      return key[0] !== key[0].toLowerCase();
    });

    keys.forEach(function (key) {
      if (typeof binformat.fieldsInverseMap[key] === 'undefined') {
        throw new Error('JSON contains unknown field: "' + key + '"');
      }
    });

    // Sort fields
    keys = sort_fields(keys);

    for (var i=0; i<keys.length; i++) {
      serialize(so, keys[i], val[keys[i]]);
    }

    if (!no_marker) {
      //Object ending marker
      STInt8.serialize(so, 0xe1);
    }
  },

  parse: function (so) {
    var output = {};
    while (so.peek(1)[0] !== 0xe1) {
      var keyval = parse(so);
      output[keyval[0]] = keyval[1];
    }
    so.read(1);
    return output;
  }
});

STObject.id = 14;

var STArray = exports.Array = new SerializedType({
  serialize: function (so, val) {
    for (var i=0, l=val.length; i<l; i++) {
      var keys = Object.keys(val[i]);

      if (keys.length !== 1) {
        throw Error('Cannot serialize an array containing non-single-key objects');
      }

      var field_name = keys[0];
      var value = val[i][field_name];
      serialize(so, field_name, value);
    }

    //Array ending marker
    STInt8.serialize(so, 0xf1);
  },

  parse: function (so) {
    var output = [ ];

    while (so.peek(1)[0] !== 0xf1) {
      var keyval = parse(so);
      var obj = { };
      obj[keyval[0]] = keyval[1];
      output.push(obj);
    }

    so.read(1);

    return output;
  }
});

STArray.id = 15;
