'use strict';

/* -------------------------------- REQUIRES -------------------------------- */

var util = require('util');
var nacl = require('tweetnacl');
var utils = require('./utils');
var Seed = require('./seed').Seed;
var UInt160 = require('./uint160').UInt160;
var UInt256 = require('./uint256').UInt256;

var arrayToHex = utils.arrayToHex;
var hexToArray = utils.hexToArray;
var sjcl = utils.sjcl;

/* ---------------------------------- ENUMS --------------------------------- */

var KeyType = exports.KeyType = {
  secp256k1: 'secp256k1',
  ed25519: 'ed25519'
};

/* ----------------------------------- OO ----------------------------------- */

function isVirtual() {
  throw new Error('virtual method not implemented ');
}

function hasCachedProperty(obj, name, computer) {
  var key = name + '__';
  obj[name] = function() {
    return this[key] !== undefined ? this[key] :
           this[key] = computer.call(this);
  };
}

/* --------------------------------- HELPERS -------------------------------- */

function toGenericArray(typedArray) {
  var generic = [];
  Array.prototype.push.apply(generic, typedArray);
  return generic;
}

/*
@private
@param {Object} opts
@param {String} [opts.seedBase58] -
@param {String} [opts.seedHex] -
@param {String} [opts.passphrase] -
@param {String} [opts.generic] -
 */
function parseSeed(opts) {
  var seed = new Seed();

  if (opts.passphrase) {
    seed.parse_passphrase(opts.passphrase);
  } else if (opts.seedBase58) {
    seed.parse_base58(opts.seedBase58);
  } else if (opts.seedHex) {
    seed.parse_hex(opts.seedHex);
  } else if (opts.generic) {
    seed.parse_json(opts.generic);
  } else {
    throw new Error('generic, seed, seed_hex, or passphrase must be supplied');
  }

  return seed;
}

/*
@private
@param {Seed} seed
 */
function deriveEdKeyPairSeed(seed) {
  var hashed = sjcl.hash.sha512.hash(seed.to_bits());
  var bits = sjcl.bitArray.bitSlice(hashed, 0, 256);
  return new Uint8Array(sjcl.codec.bytes.fromBits(bits));
}

function bytesToHex(bytes) {
  return arrayToHex(bytes).toUpperCase();
}

function bytesBnTo256Bits(bytes) {
  var bits = sjcl.codec.bytes.toBits(bytes);
  var bitLength = 256;
  return sjcl.bn.fromBits(bits).toBits(bitLength);
}

function createAccountId(publicKeyBytes) {
  var bits = sjcl.codec.bytes.toBits(publicKeyBytes);
  var hash = sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
  var id = UInt160.from_bits(hash);
  id.set_version(0);
  return id;
}

function stringifyKey(specifier) {
  if (typeof specifier === 'object') {
    var sorted = {};
    Object.keys(specifier).forEach(function(k) {
      sorted[k] = specifier[k];
    });
    return JSON.stringify(sorted);
  }

  return JSON.stringify(specifier);
}

/* --------------------------------- KEYPAIR -------------------------------- */

/*
@param {Seed} seed - 128 bit seed value
@param {Object|String} specifier - the specifier for the KeyPair
 */
function KeyPair(seed, specifier) {
  this.seed = seed;
  this.specifier = specifier;
}

/*
@param {Array} message
@virtual
 */
KeyPair.prototype.sign = isVirtual;


/*
@param {Array<Number>} message
@param {Array<Number>} signature
@virtual
 */
KeyPair.prototype.verify = isVirtual;

/*
@return {Array<Number>} of bytes, in canonical form, for signing
@virtual
*/
KeyPair.prototype.pubKeyBytes = isVirtual;

hasCachedProperty(KeyPair.prototype, 'pubKeyHex', function() {
  return bytesToHex(this.pubKeyBytes());
});

hasCachedProperty(KeyPair.prototype, 'account', function() {
  return createAccountId(this.pubKeyBytes());
});

KeyPair.prototype.signHex = function(message) {
  return bytesToHex(this.sign(message));
};

/* ---------------------------- SECP256K1 KEYPAIR --------------------------- */

/*
* @class
* @private
*/
function Ed25519Pair() {
  KeyPair.apply(this, arguments);
  var secretBytes = deriveEdKeyPairSeed(this.seed);
  var keyPair = nacl.sign.keyPair.fromSeed(secretBytes);
  this.secretKey = keyPair.secretKey;
  this.publicKey = keyPair.publicKey;
  this.type = KeyType.ed25519;
}

util.inherits(Ed25519Pair, KeyPair);

hasCachedProperty(Ed25519Pair.prototype, 'pubKeyBytes', function() {
  return [0xED].concat(toGenericArray(this.publicKey));
});

Ed25519Pair.prototype.sign = function(message) {
  var messageArray = new Uint8Array(message);
  var signatureArray = nacl.sign.detached(messageArray, this.secretKey);
  return toGenericArray(signatureArray);
};

Ed25519Pair.prototype.verify = function(message, signature) {
  var messageArray = new Uint8Array(message);
  var signatureArray = new Uint8Array(signature);
  return nacl.sign.detached.verify(messageArray, signatureArray,
                                   this.publicKey);
};

/* ---------------------------- SECP256K1 KEYPAIR --------------------------- */

/*
* @class
* @private
*/
function Secp256k1Pair() {
  KeyPair.apply(this, arguments);
  this.keyPair = this.seed.get_key();
  this.type = KeyType.secp256k1;
}

util.inherits(Secp256k1Pair, KeyPair);

hasCachedProperty(Secp256k1Pair.prototype, 'pubKeyBytes', function() {
  return hexToArray(this.keyPair.to_hex_pub());
});

function Crypt_hashSha512Half(data) {
  var hex = sjcl.codec.hex.fromBits(sjcl.hash.sha512.hash(data));
  return UInt256.from_hex(hex.substr(0, 64));
}

/*
@param {Array<Number>} message (bytes)
 */
Secp256k1Pair.prototype.sign = function(message) {
  var hash = this.hashMessage(message);
  var signatureBits = this.keyPair.sign(hash);
  return sjcl.codec.bytes.fromBits(signatureBits);
};

/*
@param {Array<Number>} message (bytes)
@return {UInt256} 256 bit hash of the message
 */
Secp256k1Pair.prototype.hashMessage = function(message) {
  var bits = sjcl.codec.bytes.toBits(message);
  return Crypt_hashSha512Half(bits);
};

/*
@param {Array<Number>} message (bytes)
@param {Array<Number>} signature (bytes)
 */
Secp256k1Pair.prototype.verify = function(message, signature) {
  var sig = signature;
  var rPos = 4;
  var rLen = sig[3];
  var sPos = rLen + 6;
  var sLen = sig[rLen + 5];
  var r = sig.slice(rPos, rPos + rLen);
  var s = sig.slice(sPos, sPos + sLen);
  var rs = sjcl.bitArray.concat(bytesBnTo256Bits(r),
                                bytesBnTo256Bits(s));
  try {
    return this.keyPair._pub().verify(this.hashMessage(message).to_bits(), rs);
  } catch (e) {
    return false;
  }
};

exports.getKeyPair = function(specifier) {
  if (specifier instanceof KeyPair) {
    return specifier;
  }

  var isGeneric = typeof specifier === 'string';
  var specifierObj = isGeneric ? {} : specifier;
  var keyType = specifierObj.key_type;

  if (isGeneric) {
    specifierObj.generic = arguments[0];
  }
  if (!keyType) {
    keyType = KeyType.secp256k1;
  }

  var seed = parseSeed(specifierObj);

  if (keyType === KeyType.secp256k1) {
    return new Secp256k1Pair(seed, specifier);
  } else if (keyType === KeyType.ed25519) {
    return new Ed25519Pair(seed, specifier);
  }

  throw new Error('unknown key_type ' + keyType);
};

exports.keyPairCache = {};

exports.getCachedKeyPair = function(specifier) {
  if (specifier instanceof KeyPair) {
    return specifier;
  }

  var cache = exports.keyPairCache;
  var key = stringifyKey(specifier);

  return cache[key] ? cache[key] : cache[key] = exports.getKeyPair(specifier);
};
