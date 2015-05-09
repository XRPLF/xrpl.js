'use strict';

/* -------------------------------- REQUIRES -------------------------------- */

var util = require('util');
var nacl = require('tweetnacl');
var lodash = require('lodash');

var utils = require('./utils');
var Base = require('./base').Base;
var Seed = require('./seed').Seed;
var UInt160 = require('./uint160').UInt160;

var arrayToHex = utils.arrayToHex;
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
  obj.prototype[name] = function() {
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

function bytesToHex(bytes) {
  return arrayToHex(bytes).toUpperCase();
}

/*

Seed.from_json is too loose, and discriminates between seed and passphrase via
the first letter of the passed in string. This requires explicitly declaring
what format the seed is in.

@private
@param {Object} opts
@param {String} [opts.base58] -
@param {String} [opts.hex] -
@param {String} [opts.passphrase] -
@param {String} [opts.generic] -
 */
function parseSeed(opts) {
  var seed = new Seed();

  if (opts.passphrase) {
    seed.parse_passphrase(opts.passphrase);
  } else if (opts.base58) {
    seed.parse_base58(opts.base58);
  } else if (opts.hex) {
    seed.parse_hex(opts.hex);
  } else if (opts.generic) {
    seed.parse_json(opts.generic);
  } else {
    throw new Error('generic, base58, hex, or passphrase must be supplied');
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

function findk256Key(bytes, discrim) {
  var curve = sjcl.ecc.curves.k256;
  var key;

  for (var i = 0; i <= 0xFFFFFFFF; i++) {
    // We hash the bytes to find a 256 bit number, looping until we are sure
    // it is less than the order of the curve.
    var hasher = new utils.Sha512().addBytes(bytes);
    // If the optional discriminator index was passed in, update the hash.
    if (discrim !== undefined) {
      hasher.addU32(discrim);
    }
    hasher.addU32(i);
    key = hasher.finish256BN();

    /* eslint-disable max-len */

    /*
    # js
    >>> console.log(curve.r.toString(16).toUpperCase())
    0XFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

    # python
    >>> order = b'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141'
    >>> import struct, hashlib, os
    >>> randoms = lambda: (os.urandom(16) for i in range(2**12))
    >>> h256 = lambda b, i: int(hashlib.sha512(b+struct.pack('>I', i)).hexdigest()[:64], 16)
    >>> (2 ** 12) ** 2
    16777216
    >>> all(h256(r, i) < order for r in randoms() for i in range(2**12))
    True

    We basically always break here, but for the vanishingly rare case that we
    don't we'll increment i and continue. :)

    */

    /* eslint-enable max-len */
    if (key.greaterEquals(1) && !key.greaterEquals(curve.r)) {
      break;
    } /*else {
      throw new Error('omg unicorn ;) ');
    }*/
  }
  return key;
}

/* eslint-disable valid-jsdoc */

/**
* @param {Object} [options] -
* @param {Number} [options.accountIndex=0] - the account number to generate
* @param {Boolean} [options.root=false] - generate root key-pair,
*                                         as used by validators.
* @return {new sjcl.ecc.ecdsa.secretKey} -
*
*/

/* eslint-enable valid-jsdoc */

function derivek256Secret(seed, options) {
  if (!seed.is_valid()) {
    throw new Error('Cannot generate keys from invalid seed!');
  }

  var curve = sjcl.ecc.curves.k256;
  var opts = options || {};
  var root = opts.root;

  // This private generator represents the `root` private key, and is what's
  // used by validators for signing when a keypair is generated from a seed.
  var privateGen = findk256Key(seed.to_bytes());
  var secret;

  if (root) {
    // As used by validation_create
    secret = privateGen;
  } else {
    var publicGen = curve.G.mult(privateGen);

    // A seed can generate many keypairs as a function of the seed and a uint32.
    // Almost everyone just uses the first account, `0`.
    var accountIndex = opts.accountIndex || 0;
    secret = findk256Key(publicGen.toBytesCompressed(), accountIndex)
                             .add(privateGen).mod(curve.r);
  }

  // The public key is lazily computed by the key class, but it has the same
  // mathematical relationship to `secret` as `publicGen` to `privateGen`. The
  // `secret` will be available as the `_exponent` property on the secretKey.
  var SjclSecretKey = sjcl.ecc.ecdsa.secretKey;
  return new SjclSecretKey(curve, secret);
}

function bytesBnTo256Bits(bytes) {
  var bits = sjcl.codec.bytes.toBits(bytes);
  var bitLength = 256;
  return sjcl.bn.fromBits(bits).toBits(bitLength);
}

function extractRSFromDER(signature) {
  var rPos = 4;
  var rLen = signature[3];
  var sPos = rLen + 6;
  var sLen = signature[rLen + 5];
  var r = signature.slice(rPos, rPos + rLen);
  var s = signature.slice(sPos, sPos + sLen);
  var rs = sjcl.bitArray.concat(bytesBnTo256Bits(r),
                                bytesBnTo256Bits(s));
  return rs;
}

function createAccountId(pubKeyBytes) {
  var bits = sjcl.codec.bytes.toBits(pubKeyBytes);
  var hash = sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
  var id = UInt160.from_bits(hash);
  id.set_version(Base.VER_ACCOUNT_ID);
  return id;
}

/* --------------------------------- KEYPAIR -------------------------------- */

function KeyPair() {}

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

hasCachedProperty(KeyPair, 'pubKeyHex', function() {
  return bytesToHex(this.pubKeyBytes());
});

hasCachedProperty(KeyPair, 'account', function() {
  return createAccountId(this.pubKeyBytes());
});

KeyPair.prototype.signHex = function(message) {
  return bytesToHex(this.sign(message));
};

/* ---------------------------- SECP256K1 KEYPAIR --------------------------- */

/*
* @class
* @private
* @param {Object} - obj secretKey/publicKey Uint8Array members
*                   (as returned by nacl.sign.keyPair)
*/
function Ed25519Pair(keyPair) {
  KeyPair.apply(this, arguments);
  this.secretKey = keyPair.secretKey;
  this.publicKey = keyPair.publicKey;
  this.type = KeyType.ed25519;
}

util.inherits(Ed25519Pair, KeyPair);

/**
* @param {Seed} seed - A 128 bit seed
* @return {Ed25519Pair} key pair
*/
Ed25519Pair.fromSeed = function(seed) {
  var seed256 = deriveEdKeyPairSeed(seed);
  var keyPair = nacl.sign.keyPair.fromSeed(seed256);
  return new Ed25519Pair(keyPair);
};

hasCachedProperty(Ed25519Pair, 'pubKeyBytes', function() {
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
function Secp256k1Pair(secretKey) {
  KeyPair.apply(this, arguments);
  this.secretKey = secretKey;
  this.type = KeyType.secp256k1;
  this.curve = sjcl.ecc.curves.k256;
}

util.inherits(Secp256k1Pair, KeyPair);

Secp256k1Pair.fromSeed = function(seed) {
  return new Secp256k1Pair(derivek256Secret(seed));
};

hasCachedProperty(Secp256k1Pair, 'pubKey', function() {
  var exponent = this.secretKey._exponent;
  var EcdsaPublicKey = sjcl.ecc.ecdsa.publicKey;
  return new EcdsaPublicKey(this.curve, this.curve.G.mult(exponent));
});

hasCachedProperty(Secp256k1Pair, 'pubKeyBytes', function() {
  return this.pubKey()._point.toBytesCompressed();
});

/*
@param {Array<Number>} message (bytes)
 */
Secp256k1Pair.prototype.sign = function(message) {
  var hash = this.hashMessage(message);
  var sig = this.secretKey.signDeterministic(hash);
  sig = this.secretKey.canonicalizeSignature(sig);
  return sjcl.codec.bytes.fromBits(this.secretKey.encodeDER(sig));
};

/*
@param {Array<Number>} message (bytes)
@return {sjcl.bitArray} 256 bit hash of the message
 */
Secp256k1Pair.prototype.hashMessage = function(message) {
  return new utils.Sha512().addBytes(message).finish256Bits();
};

/*
@param {Array<Number>} message - bytes
@param {Array<Number>} signature - DER encoded signature bytes
 */
Secp256k1Pair.prototype.verify = function(message, signature) {
  try {
    return this.pubKey().verify(this.hashMessage(message),
                                extractRSFromDER(signature));
  } catch (e) {
    return false;
  }
};

exports.getKeyPair = function(specifier) {
  // TODO: take seed, or base58 encoded secretKey
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
  if (lodash.isEqual(seed._version, Base.VER_ED25519_SEED)) {
    keyType = KeyType.ed25519;
  }

  if (keyType === KeyType.secp256k1) {
    return Secp256k1Pair.fromSeed(seed);
  } else if (keyType === KeyType.ed25519) {
    return Ed25519Pair.fromSeed(seed);
  }

  throw new Error('unknown key_type ' + keyType);
};
