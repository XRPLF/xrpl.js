'use strict';

/**
 * Type definitions for binary format.
 *
 * This file should not be included directly. Instead, find the format you're
 * trying to parse or serialize in binformat.js and pass that to
 * SerializedObject.parse() or SerializedObject.serialize().
 */

const assert = require('assert');
const extend = require('extend');
const GlobalBigNumber = require('bignumber.js');
const Amount = require('./amount').Amount;
const Currency = require('./currency').Currency;
const binformat = require('./binformat');
const utils = require('./utils');
const sjcl = utils.sjcl;
const SJCL_BN = sjcl.bn;

const UInt128 = require('./uint128').UInt128;
const UInt160 = require('./uint160').UInt160;
const UInt256 = require('./uint256').UInt256;
const Base = require('./base').Base;

const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

function SerializedType(methods) {
  extend(this, methods);
}

function isNumber(val) {
  return typeof val === 'number' && isFinite(val);
}

function isString(val) {
  return typeof val === 'string';
}

function isHexInt64String(val) {
  return isString(val) && /^[0-9A-F]{0,16}$/i.test(val);
}

function serializeBits(so, bits, noLength) {
  const byteData = sjcl.codec.bytes.fromBits(bits);
  if (!noLength) {
    SerializedType.serialize_varint(so, byteData.length);
  }
  so.append(byteData);
}

function serializeHex(so, hexData, noLength) {
  serializeBits(so, sjcl.codec.hex.toBits(hexData), noLength);
}

/**
 * parses bytes as hex
 *
 * @param {Array} byte_array bytes
 * @return {String} hex string
 */
function convertByteArrayToHex(byte_array) {
  return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(byte_array))
  .toUpperCase();
}

function convertHexToString(hexString) {
  const bits = sjcl.codec.hex.toBits(hexString);
  return sjcl.codec.utf8String.fromBits(bits);
}

function sort_fields(keys) {
  function sort_field_compare(a, b) {
    const a_field_coordinates = binformat.fieldsInverseMap[a];
    const a_type_bits = a_field_coordinates[0];
    const a_field_bits = a_field_coordinates[1];
    const b_field_coordinates = binformat.fieldsInverseMap[b];
    const b_type_bits = b_field_coordinates[0];
    const b_field_bits = b_field_coordinates[1];

    // Sort by type id first, then by field id
    return a_type_bits !== b_type_bits
    ? a_type_bits - b_type_bits
    : a_field_bits - b_field_bits;
  }

  return keys.sort(sort_field_compare);
}

SerializedType.serialize_varint = function(so, val) {
  let value = val;
  if (value < 0) {
    throw new Error('Variable integers are unsigned.');
  }

  if (value <= 192) {
    so.append([value]);
  } else if (value <= 12480) {
    value -= 193;
    so.append([193 + (value >>> 8), value & 0xff]);
  } else if (value <= 918744) {
    value -= 12481;
    so.append([241 + (value >>> 16), value >>> 8 & 0xff, value & 0xff]);
  } else {
    throw new Error('Variable integer overflow.');
  }
};

SerializedType.prototype.parse_varint = function(so) {
  const b1 = so.read(1)[0];
  let b2, b3;
  let result;

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

// In the following, we assume that the inputs are in the proper range. Is this
// correct?
// Helper functions for 1-, 2-, and 4-byte integers.

/**
 * Convert an integer value into an array of bytes.
 *
 * The result is appended to the serialized object ('so').
 *
 * @param {Number} val value
 * @param {Number} bytes byte size
 * @return {Array} byte array
 */
function convertIntegerToByteArray(val, bytes) {
  if (!isNumber(val)) {
    throw new Error('Value is not a number', bytes);
  }

  if (val < 0 || val >= Math.pow(256, bytes)) {
    throw new Error('Value out of bounds ');
  }

  const newBytes = [ ];

  for (let i = 0; i < bytes; i++) {
    newBytes.unshift(val >>> (i * 8) & 0xff);
  }

  return newBytes;
}

// Convert a certain number of bytes from the serialized object ('so') into an
// integer.
function readAndSum(so, bytes) {
  let sum = 0;

  if (bytes > 4) {
    throw new Error('This function only supports up to four bytes.');
  }

  for (let i = 0; i < bytes; i++) {
    const byte = so.read(1)[0];
    sum += (byte << (8 * (bytes - i - 1)));
  }

  // Convert to unsigned integer
  return sum >>> 0;
}

const STInt8 = exports.Int8 = new SerializedType({
  serialize: function(so, val) {
    so.append(convertIntegerToByteArray(val, 1));
  },
  parse: function(so) {
    return readAndSum(so, 1);
  }
});

STInt8.id = 16;

function serialize(so, field_name, value) {
  // so: a byte-stream to serialize into.
  // field_name: a string for the field name ('LedgerEntryType' etc.)
  // value: the value of that field.
  const field_coordinates = binformat.fieldsInverseMap[field_name];
  const type_bits = field_coordinates[0];
  const field_bits = field_coordinates[1];
  const tag_byte = (type_bits < 16
    ? type_bits << 4
    : 0) | (field_bits < 16
      ? field_bits
      : 0);
  let val = value;

  if (field_name === 'LedgerEntryType' && typeof val === 'string') {
    val = binformat.ledger[val][0];
  }

  if (field_name === 'TransactionResult' && typeof val === 'string') {
    val = binformat.ter[val];
  }

  STInt8.serialize(so, tag_byte);

  if (type_bits >= 16) {
    STInt8.serialize(so, type_bits);
  }

  if (field_bits >= 16) {
    STInt8.serialize(so, field_bits);
  }

  // Get the serializer class (ST...)
  let serialized_object_type;

  if (field_name === 'Memo' && typeof val === 'object') {
    // for Memo we override the default behavior with our STMemo serializer
    serialized_object_type = exports.STMemo;
  } else {
    // for a field based on the type bits.
    serialized_object_type = exports[binformat.types[type_bits]];
  }

  try {
    serialized_object_type.serialize(so, val);
  } catch (e) {
    e.message += ' (' + field_name + ')';
    throw e;
  }
}

exports.serialize = exports.serialize_whatever = serialize;

// Take the serialized object, figure out what type/field it is, and return the
// parsing of that.

function parse(so) {
  const tag_byte = so.read(1)[0];
  let type_bits = tag_byte >> 4;

  if (type_bits === 0) {
    type_bits = so.read(1)[0];
  }

  const field_bits = tag_byte & 0x0f;
  const field_name = (field_bits === 0)
    ? binformat.fields[type_bits][so.read(1)[0]]
    : binformat.fields[type_bits][field_bits];

  assert(field_name, 'Unknown field - header byte is 0x'
    + tag_byte.toString(16));

  // Get the parser class (ST...) for a field based on the type bits.
  const type = (field_name === 'Memo')
    ? exports.STMemo
    : exports[binformat.types[type_bits]];

  assert(type, 'Unknown type - header byte is 0x' + tag_byte.toString(16));

  return [field_name, type.parse(so)]; // key, value
}

exports.parse = exports.parse_whatever = parse;

const STInt16 = exports.Int16 = new SerializedType({
  serialize: function(so, val) {
    so.append(convertIntegerToByteArray(val, 2));
  },
  parse: function(so) {
    return readAndSum(so, 2);
  }
});

STInt16.id = 1;

const STInt32 = exports.Int32 = new SerializedType({
  serialize: function(so, val) {
    so.append(convertIntegerToByteArray(val, 4));
  },
  parse: function(so) {
    return readAndSum(so, 4);
  }
});

STInt32.id = 2;

const STInt64 = exports.Int64 = new SerializedType({
  serialize: function(so, val) {
    let bigNumObject;
    let value = val;

    if (isNumber(value)) {
      value = Math.floor(value);
      if (value < 0) {
        throw new Error('Negative value for unsigned Int64 is invalid.');
      }
      bigNumObject = new SJCL_BN(value, 10);
    } else if (isString(value)) {
      if (!isHexInt64String(value)) {
        throw new Error('Not a valid hex Int64.');
      }
      bigNumObject = new SJCL_BN(value, 16);
    } else if (value instanceof SJCL_BN) {
      if (!value.greaterEquals(0)) {
        throw new Error('Negative value for unsigned Int64 is invalid.');
      }
      bigNumObject = value;
    } else {
      throw new Error('Invalid type for Int64');
    }
    serializeBits(so, bigNumObject.toBits(64), true); // noLength = true
  },
  parse: function(so) {
    const bytes = so.read(8);
    return SJCL_BN.fromBits(sjcl.codec.bytes.toBits(bytes));
  }
});

STInt64.id = 3;

const STHash128 = exports.Hash128 = new SerializedType({
  serialize: function(so, val) {
    const hash = UInt128.from_json(val);
    if (!hash.is_valid()) {
      throw new Error('Invalid Hash128');
    }
    serializeBits(so, hash.to_bits(), true); // noLength = true
  },
  parse: function(so) {
    return UInt128.from_bytes(so.read(16));
  }
});

STHash128.id = 4;

const STHash256 = exports.Hash256 = new SerializedType({
  serialize: function(so, val) {
    const hash = UInt256.from_json(val);
    if (!hash.is_valid()) {
      throw new Error('Invalid Hash256');
    }
    serializeBits(so, hash.to_bits(), true); // noLength = true
  },
  parse: function(so) {
    return UInt256.from_bytes(so.read(32));
  }
});

STHash256.id = 5;

const STHash160 = exports.Hash160 = new SerializedType({
  serialize: function(so, val) {
    const hash = UInt160.from_json(val);
    if (!hash.is_valid()) {
      throw new Error('Invalid Hash160');
    }
    serializeBits(so, hash.to_bits(), true); // noLength = true
  },
  parse: function(so) {
    return UInt160.from_bytes(so.read(20));
  }
});

STHash160.id = 17;

// Internal
const STCurrency = new SerializedType({
  serialize: function(so, val) {
    const currencyData = val.to_bytes();

    if (!currencyData) {
      throw new Error(
        'Tried to serialize invalid/unimplemented currency type.');
    }

    so.append(currencyData);
  },
  parse: function(so) {
    const bytes = so.read(20);
    const currency = Currency.from_bytes(bytes);
    // XXX Disabled check. Theoretically, the Currency class should support any
    //     UInt160 value and consider it valid. But it doesn't, so for the
    //     deserialization to be usable, we need to allow invalid results for
    //     now.
    // if (!currency.is_valid()) {
    //   throw new Error('Invalid currency: '+convertByteArrayToHex(bytes));
    // }
    return currency;
  }
});

/**
 * Quality is encoded into 64 bits:
 * (8 bits offset) (56 bits mantissa)
 *
 * Quality differs from Amount because it does not need the first two bits
 * to represent non-native and non-negative
 */
exports.Quality = new SerializedType({
  serialize: function(so, val) {
    let value;
    // if in format: amount/currency/issuer
    if (val.includes('/')) {
      const amount = Amount.from_json(val);

      if (!amount.is_valid()) {
        throw new Error('Not a valid Amount object.');
      }
      value = new BigNumber(amount.to_text());
    } else {
      value = new BigNumber(val);
    }

    let hi = 0, lo = 0;

    const offset = value.e - 15;
    if (val !== 0) {
      // First eight bits: offset/exponent
      hi |= ((100 + offset) & 0xff) << 24;

      // Remaining 56 bits: mantissa
      const mantissaDecimal = utils.getMantissaDecimalString(value.abs());
      const mantissaHex = (new BigNumber(mantissaDecimal)).toString(16);
      assert(mantissaHex.length <= 16,
        'Mantissa hex representation ' + mantissaHex +
        ' exceeds the maximum length of 16');
      hi |= parseInt(mantissaHex.slice(0, -8), 16) & 0xffffff;
      lo = parseInt(mantissaHex.slice(-8), 16);
    }

    const valueBytes = sjcl.codec.bytes.fromBits([hi, lo]);

    so.append(valueBytes);
  }
});

/*
 * Amount is encoded into 64 bits:
 * (1 bit non-native) (1 bit non-negative) (8 bits offset) (54 bits mantissa)
 */
const STAmount = exports.Amount = new SerializedType({
  serialize: function(so, val) {
    const amount = Amount.from_json(val);

    if (!amount.is_valid()) {
      throw new Error('Not a valid Amount object.');
    }

    const value = new BigNumber(amount.to_text());
    const offset = value.e - 15;

    // Amount (64-bit integer)
    let valueBytes = utils.arraySet(8, 0);

    if (amount.is_native()) {
      let valueHex = value.abs().toString(16);

      if (Amount.strict_mode && value.abs().greaterThan(Amount.bi_xns_max)) {
        throw new Error('Value out of bounds');
      }

      // Enforce correct length (64 bits)
      if (Amount.strict_mode && valueHex.length > 16) {
        throw new Error('Value out of bounds');
      }

      while (valueHex.length < 16) {
        valueHex = '0' + valueHex;
      }

      valueBytes = sjcl.codec.bytes.fromBits(sjcl.codec.hex.toBits(valueHex));
      // Clear most significant two bits - these bits should already be 0 if
      // Amount enforces the range correctly, but we'll clear them anyway just
      // so this code can make certain guarantees about the encoded value.
      valueBytes[0] &= 0x3f;

      if (!amount.is_negative()) {
        valueBytes[0] |= 0x40;
      }
    } else {
      let hi = 0, lo = 0;

      // First bit: non-native
      hi |= 1 << 31;

      if (!amount.is_zero()) {
        // Second bit: non-negative?
        if (!amount.is_negative()) {
          hi |= 1 << 30;
        }

        // Next eight bits: offset/exponent
        hi |= ((97 + offset) & 0xff) << 22;

        // Remaining 54 bits: mantissa
        const mantissaDecimal = utils.getMantissaDecimalString(value.abs());
        const mantissaHex = (new BigNumber(mantissaDecimal)).toString(16);
        assert(mantissaHex.length <= 16,
          'Mantissa hex representation ' + mantissaHex +
          ' exceeds the maximum length of 16');
        hi |= parseInt(mantissaHex.slice(0, -8), 16) & 0x3fffff;
        lo = parseInt(mantissaHex.slice(-8), 16);
      }

      valueBytes = sjcl.codec.bytes.fromBits([hi, lo]);
    }

    so.append(valueBytes);

    if (!amount.is_native()) {
      // Currency (160-bit hash)
      const currency = amount.currency();
      STCurrency.serialize(so, currency, true);

      // Issuer (160-bit hash)
      so.append(amount.issuer().to_bytes());
    }
  },
  parse: function(so) {
    const value_bytes = so.read(8);
    let is_zero = !(value_bytes[0] & 0x7f);

    for (let i = 1; i < 8; i++) {
      is_zero = is_zero && !value_bytes[i];
    }

    const is_negative = !is_zero && !(value_bytes[0] & 0x40);

    if (value_bytes[0] & 0x80) {
      // non-native
      const currency = STCurrency.parse(so);
      const issuer_bytes = so.read(20);
      const issuer = UInt160.from_bytes(issuer_bytes);
      issuer.set_version(Base.VER_ACCOUNT_ID);
      const offset =
        ((value_bytes[0] & 0x3f) << 2) + (value_bytes[1] >>> 6) - 97;
      const mantissa_bytes = value_bytes.slice(1);
      mantissa_bytes[0] &= 0x3f;
      const mantissa = new BigNumber(utils.arrayToHex(mantissa_bytes), 16);
      const sign = is_negative ? '-' : '';
      const valueString = sign + mantissa.toString() + 'e' + offset.toString();

      return Amount.from_json({
        currency: currency,
        issuer: issuer.to_json(),
        value: valueString
      });
    }

    // native
    const integer_bytes = value_bytes.slice();
    integer_bytes[0] &= 0x3f;
    const integer_hex = utils.arrayToHex(integer_bytes);
    const value = new BigNumber(integer_hex, 16);
    return Amount.from_json((is_negative ? '-' : '') + value.toString());
  }
});

STAmount.id = 6;

const STVL = exports.VariableLength = exports.VL = new SerializedType({
  serialize: function(so, val) {
    if (typeof val === 'string') {
      serializeHex(so, val);
    } else {
      throw new Error('Unknown datatype.');
    }
  },
  parse: function(so) {
    const len = this.parse_varint(so);
    return convertByteArrayToHex(so.read(len));
  }
});

STVL.id = 7;

const STAccount = exports.Account = new SerializedType({
  serialize: function(so, val) {
    const account = UInt160.from_json(val);
    if (!account.is_valid()) {
      throw new Error('Invalid account!');
    }
    serializeBits(so, account.to_bits());
  },
  parse: function(so) {
    const len = this.parse_varint(so);

    if (len !== 20) {
      throw new Error('Non-standard-length account ID');
    }

    const result = UInt160.from_bytes(so.read(len));
    result.set_version(Base.VER_ACCOUNT_ID);

    if (false && !result.is_valid()) {
      throw new Error('Invalid Account');
    }

    return result;
  }
});

STAccount.id = 8;

const STPathSet = exports.PathSet = new SerializedType({
  typeBoundary: 0xff,
  typeEnd: 0x00,
  typeAccount: 0x01,
  typeCurrency: 0x10,
  typeIssuer: 0x20,
  serialize: function(so, val) {
    for (let i = 0, l = val.length; i < l; i++) {
      // Boundary
      if (i) {
        STInt8.serialize(so, this.typeBoundary);
      }

      for (let j = 0, l2 = val[i].length; j < l2; j++) {
        const entry = val[i][j];
        // if (entry.hasOwnProperty('_value')) {entry = entry._value;}
        let type = 0;

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
          STHash160.serialize(so, entry.account);
        }

        if (entry.currency) {
          const currency = Currency.from_json(entry.currency, entry.non_native);
          STCurrency.serialize(so, currency);
        }

        if (entry.issuer) {
          STHash160.serialize(so, entry.issuer);
        }
      }
    }

    STInt8.serialize(so, this.typeEnd);
  },
  parse: function(so) {
    // should return a list of lists:
    /*
       [
       [entry, entry],
       [entry, entry, entry],
       [entry],
       []
       ]

       each entry has one or more of the following attributes:
       amount, currency, issuer.
       */

    const path_list = [];
    let current_path = [];
    let tag_byte;

    /* eslint-disable no-cond-assign */

    while ((tag_byte = so.read(1)[0]) !== this.typeEnd) {
      // TODO: try/catch this loop, and catch when we run out of data without
      // reaching the end of the data structure.
      // Now determine: is this an end, boundary, or entry-begin-tag?
      // console.log('Tag byte:', tag_byte);
      if (tag_byte === this.typeBoundary) {
        if (current_path) { // close the current path, if there is one,
          path_list.push(current_path);
        }
        current_path = [ ]; // and start a new one.
        continue;
      }

      // It's an entry-begin tag.
      const entry = {};
      let type = 0;

      if (tag_byte & this.typeAccount) {
        entry.account = STHash160.parse(so);
        entry.account.set_version(Base.VER_ACCOUNT_ID);
        type = type | this.typeAccount;
      }
      if (tag_byte & this.typeCurrency) {
        entry.currency = STCurrency.parse(so);
        if (entry.currency.to_json() === 'XRP' && !entry.currency.is_native()) {
          entry.non_native = true;
        }
        type = type | this.typeCurrency;
      }
      if (tag_byte & this.typeIssuer) {
        entry.issuer = STHash160.parse(so);
        // Enable and set correct type of base-58 encoding
        entry.issuer.set_version(Base.VER_ACCOUNT_ID);
        type = type | this.typeIssuer;
      }

      if (entry.account || entry.currency || entry.issuer) {
        entry.type = type;
        entry.type_hex = ('000000000000000' + type.toString(16)).slice(-16);
        current_path.push(entry);
      } else {
        // It must have at least something in it.
        throw new Error('Invalid path entry');
      }
    }

    if (current_path) {
      // close the current path, if there is one,
      path_list.push(current_path);
    }

    return path_list;
  }
});

STPathSet.id = 18;

const STVector256 = exports.Vector256 = new SerializedType({
  serialize: function(so, val) {
    // Assume val is an array of STHash256 objects.
    SerializedType.serialize_varint(so, val.length * 32);
    for (let i = 0, l = val.length; i < l; i++) {
      STHash256.serialize(so, val[i]);
    }
  },
  parse: function(so) {
    const length = this.parse_varint(so);
    const output = [];
    // length is number of bytes not number of Hash256
    for (let i = 0; i < length / 32; i++) {
      output.push(STHash256.parse(so));
    }
    return output;
  }
});

STVector256.id = 19;

// Internal
exports.STMemo = new SerializedType({
  serialize: function(so, val, no_marker) {
    let keys = [];

    Object.keys(val).forEach(function(key) {
      // Ignore lowercase field names - they're non-serializable fields by
      // convention.
      if (key[0] === key[0].toLowerCase()) {
        return;
      }

      if (typeof binformat.fieldsInverseMap[key] === 'undefined') {
        throw new Error('JSON contains unknown field: "' + key + '"');
      }

      keys.push(key);
    });

    // Sort fields
    keys = sort_fields(keys);

    keys.forEach(function(key) {
      serialize(so, key, val[key]);
    });

    if (!no_marker) {
      // Object ending marker
      STInt8.serialize(so, 0xe1);
    }
  },
  parse: function(so) {
    const output = {};

    while (so.peek(1)[0] !== 0xe1) {
      const keyval = parse(so);
      output[keyval[0]] = keyval[1];
    }

    if (output.MemoType !== undefined) {
      try {
        const parsedType = convertHexToString(output.MemoType);

        if (parsedType !== 'unformatted_memo') {
          output.parsed_memo_type = parsedType;
        }
        /*eslint-disable no-empty*/
      } catch (e) {
        // empty
        // we don't know what's in the binary, apparently it's not a UTF-8
        // string
        // this is fine, we won't add the parsed_memo_type field
      }
      /*eslint-enable no-empty*/
    }

    if (output.MemoFormat !== undefined) {
      try {
        output.parsed_memo_format = convertHexToString(output.MemoFormat);
        /*eslint-disable no-empty*/
      } catch (e) {
        // empty
        // we don't know what's in the binary, apparently it's not a UTF-8
        // string
        // this is fine, we won't add the parsed_memo_format field
      }
      /*eslint-enable no-empty*/
    }

    if (output.MemoData !== undefined) {

      try {
        if (output.parsed_memo_format === 'json') {
          // see if we can parse JSON
          output.parsed_memo_data =
          JSON.parse(convertHexToString(output.MemoData));

        } else if (output.parsed_memo_format === 'text') {
          // otherwise see if we can parse text
          output.parsed_memo_data = convertHexToString(output.MemoData);
        }
        /*eslint-disable no-empty*/
      } catch(e) {
        // empty
        // we'll fail in case the content does not match what the MemoFormat
        // described
        // this is fine, we won't add the parsed_memo_data, the user has to
        // parse themselves
      }
      /*eslint-enable no-empty*/
    }

    so.read(1);
    return output;
  }

});

const STObject = exports.Object = new SerializedType({
  serialize: function(so, val, no_marker) {
    let keys = [];

    Object.keys(val).forEach(function(key) {
      // Ignore lowercase field names - they're non-serializable fields by
      // convention.
      if (key[0] === key[0].toLowerCase()) {
        return;
      }

      if (typeof binformat.fieldsInverseMap[key] === 'undefined') {
        throw new Error('JSON contains unknown field: "' + key + '"');
      }

      keys.push(key);
    });

    // Sort fields
    keys = sort_fields(keys);

    for (let i = 0; i < keys.length; i++) {
      serialize(so, keys[i], val[keys[i]]);
    }

    if (!no_marker) {
      // Object ending marker
      STInt8.serialize(so, 0xe1);
    }
  },

  parse: function(so) {
    const output = {};
    while (so.peek(1)[0] !== 0xe1) {
      const keyval = parse(so);
      output[keyval[0]] = keyval[1];
    }
    so.read(1);
    return output;
  }
});

STObject.id = 14;

const STArray = exports.Array = new SerializedType({
  serialize: function(so, val) {
    for (let i = 0, l = val.length; i < l; i++) {
      const keys = Object.keys(val[i]);

      if (keys.length !== 1) {
        throw new Error(
          'Cannot serialize an array containing non-single-key objects');
      }

      const field_name = keys[0];
      const value = val[i][field_name];
      serialize(so, field_name, value);
    }

    // Array ending marker
    STInt8.serialize(so, 0xf1);
  },

  parse: function(so) {
    const output = [ ];

    while (so.peek(1)[0] !== 0xf1) {
      const keyval = parse(so);
      const obj = { };
      obj[keyval[0]] = keyval[1];
      output.push(obj);
    }

    so.read(1);

    return output;
  }
});

STArray.id = 15;
