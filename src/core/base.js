'use strict';
const _ = require('lodash');
const sjcl = require('./utils').sjcl;
const utils = require('./utils');
const extend = require('extend');
const convertBase = require('./baseconverter');

const Base = {};

const alphabets = Base.alphabets = {
  ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
};

extend(Base, {
  VER_NONE: 1,
  VER_NODE_PUBLIC: 28,
  VER_NODE_PRIVATE: 32,
  VER_ACCOUNT_ID: 0,
  VER_ACCOUNT_PUBLIC: 35,
  VER_ACCOUNT_PRIVATE: 34,
  VER_FAMILY_GENERATOR: 41,
  VER_FAMILY_SEED: 33
});

function sha256(bytes) {
  return sjcl.codec.bytes.fromBits(
    sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes)));
}

function encodeString(alphabet, input) {
  if (input.length === 0) {
    return '';
  }

  const leadingZeros = _.takeWhile(input, function(d) {
    return d === 0;
  });
  const out = convertBase(input, 256, 58).map(function(digit) {
    if (digit < 0 || digit >= alphabet.length) {
      throw new Error('Value ' + digit + ' is out of bounds for encoding');
    }
    return alphabet[digit];
  });
  const prefix = leadingZeros.map(function() {
    return alphabet[0];
  });
  return prefix.concat(out).join('');
}

function decodeString(indexes, input) {
  if (input.length === 0) {
    return [];
  }

  const input58 = input.split('').map(function(c) {
    const charCode = c.charCodeAt(0);
    if (charCode >= indexes.length || indexes[charCode] === -1) {
      throw new Error('Character ' + c + ' is not valid for encoding');
    }
    return indexes[charCode];
  });
  const leadingZeros = _.takeWhile(input58, function(d) {
    return d === 0;
  });
  const out = convertBase(input58, 58, 256);
  return leadingZeros.concat(out);
}

function Base58(alphabet) {
  const indexes = utils.arraySet(128, -1);
  for (let i = 0; i < alphabet.length; i++) {
    indexes[alphabet.charCodeAt(i)] = i;
  }
  return {
    decode: decodeString.bind(null, indexes),
    encode: encodeString.bind(null, alphabet)
  };
}

Base.encoders = {};
Object.keys(alphabets).forEach(function(alphabet) {
  Base.encoders[alphabet] = new Base58(alphabets[alphabet]);
});

// --> input: big-endian array of bytes.
// <-- string at least as long as input.
Base.encode = function(input, alpha) {
  return this.encoders[alpha || 'ripple'].encode(input);
};

// --> input: String
// <-- array of bytes or undefined.
Base.decode = function(input, alpha) {
  if (typeof input !== 'string') {
    return undefined;
  }
  try {
    return this.encoders[alpha || 'ripple'].decode(input);
  } catch (e) {
    return undefined;
  }
};

Base.verify_checksum = function(bytes) {
  const computed = sha256(sha256(bytes.slice(0, -4))).slice(0, 4);
  const checksum = bytes.slice(-4);
  return _.isEqual(computed, checksum);
};

// --> input: Array
// <-- String
Base.encode_check = function(version, input, alphabet) {
  const buffer = [].concat(version, input);
  const check = sha256(sha256(buffer)).slice(0, 4);

  return Base.encode([].concat(buffer, check), alphabet);
};

// --> input : String
// <-- NaN || sjcl.bn
Base.decode_check = function(version, input, alphabet) {
  const buffer = Base.decode(input, alphabet);

  if (!buffer || buffer.length < 5) {
    return NaN;
  }

  // Single valid version
  if (typeof version === 'number' && buffer[0] !== version) {
    return NaN;
  }

  // Multiple allowed versions
  if (Array.isArray(version) && _.every(version, function(v) {
    return v !== buffer[0];
  })) {
    return NaN;
  }

  if (!Base.verify_checksum(buffer)) {
    return NaN;
  }

  // We'll use the version byte to add a leading zero, this ensures JSBN doesn't
  // intrepret the value as a negative number
  buffer[0] = 0;

  return sjcl.bn.fromBits(
      sjcl.codec.bytes.toBits(buffer.slice(0, -4)));
};

exports.Base = Base;
