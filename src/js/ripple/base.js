var sjcl    = require('./utils').sjcl;
var utils   = require('./utils');
var extend  = require('extend');

var BigInteger = utils.jsbn.BigInteger;

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
};

function sha256hash(bytes) {
  return sha256(sha256(bytes));
};

// --> input: big-endian array of bytes.
// <-- string at least as long as input.
Base.encode = function(input, alpha) {
  var alphabet = alphabets[alpha || 'ripple'];
  var bi_base  = new BigInteger(String(alphabet.length));
  var bi_q     = new BigInteger();
  var bi_r     = new BigInteger();
  var bi_value = new BigInteger(input);
  var buffer   = [];

  while (bi_value.compareTo(BigInteger.ZERO) > 0) {
    bi_value.divRemTo(bi_base, bi_q, bi_r);
    bi_q.copyTo(bi_value);
    buffer.push(alphabet[bi_r.intValue()]);
  }

  for (var i=0; i !== input.length && !input[i]; i += 1) {
    buffer.push(alphabet[0]);
  }

  return buffer.reverse().join('');
};

// --> input: String
// <-- array of bytes or undefined.
Base.decode = function(input, alpha) {
  if (typeof input !== 'string') {
    return void(0);
  }

  var alphabet = alphabets[alpha || 'ripple'];
  var bi_base  = new BigInteger(String(alphabet.length));
  var bi_value = new BigInteger();
  var i;

  for (i = 0; i !== input.length && input[i] === alphabet[0]; i += 1) {
  }

  for (; i !== input.length; i += 1) {
    var v = alphabet.indexOf(input[i]);

    if (v < 0) {
      return void(0);
    }

    var r = new BigInteger();
    r.fromInt(v);
    bi_value  = bi_value.multiply(bi_base).add(r);
  }

  // toByteArray:
  // - Returns leading zeros!
  // - Returns signed bytes!
  var bytes =  bi_value.toByteArray().map(function(b) { return b ? b < 0 ? 256+b : b : 0; });
  var extra = 0;

  while (extra !== bytes.length && !bytes[extra]) {
    extra += 1;
  }

  if (extra) {
    bytes = bytes.slice(extra);
  }

  var zeros = 0;

  while (zeros !== input.length && input[zeros] === alphabet[0]) {
    zeros += 1;
  }

  return [].concat(utils.arraySet(zeros, 0), bytes);
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
// <-- NaN || BigInteger
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

  return new BigInteger(buffer.slice(0, -4), 256);
};

exports.Base = Base;
