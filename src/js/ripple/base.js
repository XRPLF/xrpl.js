var sjcl    = require('./utils').sjcl;
var utils   = require('./utils');
var extend  = require('extend');

var Base = {};

var alphabets = Base.alphabets = {
  ripple:  'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple:  'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  bitcoin:  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
};

extend(Base, {
  VER_NONE              : 1,
  VER_NODE_PUBLIC       : 28,
  VER_NODE_PRIVATE      : 32,
  VER_ACCOUNT_ID        : 0,
  VER_ACCOUNT_PUBLIC    : 35,
  VER_ACCOUNT_PRIVATE   : 34,
  VER_FAMILY_GENERATOR  : 41,
  VER_FAMILY_SEED       : 33
});

function sha256(bytes) {
  return sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes)));
}

function sha256hash(bytes) {
  return sha256(sha256(bytes));
}

function divmod58(number, startAt) {
    var remainder = 0;
    for (var i = startAt; i < number.length; i++) {
        var digit256 = number[i] & 0xFF;
        var temp = remainder * 256 + digit256;
        number[i] = (temp / 58);
        remainder = temp % 58;
    }
    return remainder;
}

function  divmod256(number58, startAt) {
    var remainder = 0;
    for (var i = startAt; i < number58.length; i++) {
        var digit58 = number58[i] & 0xFF;
        var temp = remainder * 58 + digit58;
        number58[i] = (temp / 256);
        remainder = temp % 256;
    }
    return remainder;
}

function encodeString (alphabet, input) {
  if (input.length == 0) {
    return [];
  }

  // we need to copy the buffer for calc
  scratch = input.slice();

  // Count leading zeroes.
  var zeroCount = 0;
  while (zeroCount < scratch.length &&
           scratch[zeroCount] == 0)
    ++zeroCount;

  // The actual encoding.
  var out = new Array(scratch.length * 2);
  var j = out.length;
  var startAt = zeroCount;

  while (startAt < scratch.length) {
    var mod = divmod58(scratch, startAt);
    if (scratch[startAt] == 0) {
      ++startAt;
    }
    out[--j] = alphabet[mod];
  }

  // Strip extra 'r' if there are some after decoding.
  while (j < out.length && out[j] == alphabet[0]) ++j;
  // Add as many leading 'r' as there were leading zeros.
  while (--zeroCount >= 0) out[--j] = alphabet[0];
  while(j--) out.shift();

  return out.join('');
}

function decodeString(indexes, input)  {
  var isString = typeof input === 'string';

  if (input.length == 0) {
    return [];
  }

  input58 = new Array(input.length);

  // Transform the String to a base58 byte sequence
  for (var i = 0; i < input.length; ++i) {
    if (isString) {
      var c = input.charCodeAt(i);
    }

    var digit58 = -1;
    if (c >= 0 && c < 128) {
      digit58 = indexes[c];
    }
    if (digit58 < 0) {
      throw new Error("Illegal character " + c + " at " + i);
    }

    input58[i] = digit58;
  }
  // Count leading zeroes
  var zeroCount = 0;
  while (zeroCount < input58.length && input58[zeroCount] == 0) {
    ++zeroCount;
  }
  // The encoding
  out = utils.arraySet(input.length, 0);
  var j = out.length;

  var startAt = zeroCount;
  while (startAt < input58.length) {
    var mod = divmod256(input58, startAt);
    if (input58[startAt] == 0) {
      ++startAt;
    }
    out[--j] = mod;
  }

  // Do no add extra leading zeroes, move j to first non null byte.
  while (j < out.length && (out[j] == 0)) ++j;

  j -= zeroCount;
  while(j--) out.shift();

  return out;
}

function Base58(alphabet) {
  var indexes = utils.arraySet(128, -1);
  for (var i = 0; i < alphabet.length; i++) {
    indexes[alphabet.charCodeAt(i)] = i;
  }
  return {
    decode: decodeString.bind(null, indexes),
    encode: encodeString.bind(null, alphabet)
  };
}

Base.encoders = {};
Object.keys(alphabets).forEach(function(alphabet){
  Base.encoders[alphabet] = Base58(alphabets[alphabet]);
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
    return void(0);
  }
  try {
    return this.encoders[alpha || 'ripple'].decode(input);
  }
  catch(e) {
    return (void 0);
  }
};

Base.verify_checksum = function(bytes) {
  var computed = sha256hash(bytes.slice(0, -4)).slice(0, 4);
  var checksum = bytes.slice(-4);
  var result = true;

  for (var i=0; i<4; i++) {
    if (computed[i] !== checksum[i]) {
      result = false;
      break;
    }
  }

  return result;
};

// --> input: Array
// <-- String
Base.encode_check = function(version, input, alphabet) {
  var buffer = [].concat(version, input);
  var check  = sha256(sha256(buffer)).slice(0, 4);

  return Base.encode([].concat(buffer, check), alphabet);
};

// --> input : String
// <-- NaN || sjcl.bn
Base.decode_check = function(version, input, alphabet) {
  var buffer = Base.decode(input, alphabet);

  if (!buffer || buffer.length < 5) {
    return NaN;
  }

  // Single valid version
  if (typeof version === 'number' && buffer[0] !== version) {
    return NaN;
  }

  // Multiple allowed versions
  if (Array.isArray(version)) {
    var match = false;

    for (var i=0, l=version.length; i<l; i++) {
      match |= version[i] === buffer[0];
    }

    if (!match) {
      return NaN;
    }
  }

  if (!Base.verify_checksum(buffer)) {
    return NaN;
  }

  // We'll use the version byte to add a leading zero, this ensures JSBN doesn't
  // intrepret the value as a negative number
  buffer[0] = 0;

  return sjcl.bn.fromBits (
      sjcl.codec.bytes.toBits(buffer.slice(0, -4)));
};

exports.Base = Base;
