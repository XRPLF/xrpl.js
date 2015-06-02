'use strict';

/* eslint new-cap: [2, {newIsCapExceptions: [eddsa", "secretKey"]}] */

/* -------------------------------- REQUIRES -------------------------------- */

const util = require('util');
const lodash = require('lodash');
const hashjs = require('hash.js');
const elliptic = require('elliptic');
const bnjs = require('bn.js');

const utils = require('./utils');
const Base = require('./base').Base;
const Seed = require('./seed').Seed;
const UInt160 = require('./uint160').UInt160;
const arrayToHex = utils.arrayToHex;

// elliptic
const Ec256k1 = elliptic.ec('secp256k1');
const Ed25519 = elliptic.eddsa('ed25519');

/* ---------------------------------- ENUMS --------------------------------- */

const KeyType = exports.KeyType = {
  secp256k1: 'secp256k1',
  ed25519: 'ed25519'
};

/* ----------------------------------- OO ----------------------------------- */

function isVirtual() {
  throw new Error('virtual method not implemented ');
}

function hasCachedProperty(obj, name, computer) {
  const key = name + '__';
  obj.prototype[name] = function() {
    return this[key] !== undefined ? this[key] :
           this[key] = computer.apply(this, arguments);
  };
}

/* --------------------------------- HASHER --------------------------------- */

function Sha512() {
  this.hash = hashjs.sha512();
}

Sha512.prototype.addBytes = function(bytes) {
  this.hash.update(bytes);
  return this;
};

Sha512.prototype.addU32 = function(i) {
  const bytes = [
    (i >>> 24) & 0xFF,
    (i >>> 16) & 0xFF,
    (i >>> 8) & 0xFF,
    i & 0xFF
  ];
  this.addBytes(bytes);
  return this;
};

Sha512.prototype.finish = function() {
  return this.hash.digest();
};

Sha512.prototype.finish256Bits = function() {
  return this.finish().slice(0, 32);
};

Sha512.prototype.finish256BN = function() {
  return new bnjs(this.finish256Bits());
};

/* --------------------------------- HELPERS -------------------------------- */

function toGenericArray(typedArray) {
  const generic = [];
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
  const seed = new Seed();

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
  return new Sha512().addBytes(seed.to_bytes()).finish256Bits();
}

function findk256Key(bytes, discrim) {
  const order = Ec256k1.curve.n;
  let key;

  for (let i = 0; i <= 0xFFFFFFFF; i++) {
    // We hash the bytes to find a 256 bit number, looping until we are sure it
    // is less than the order of the curve.
    const hasher = new Sha512().addBytes(bytes);
    // If the optional discriminator index was passed in, update the hash.
    if (discrim !== undefined) {
      hasher.addU32(discrim);
    }
    hasher.addU32(i);
    key = hasher.finish256BN();
    if (key.cmpn(0) > 0 && key.cmp(order) < 0) {
      break;
    }
  }
  return key;
}

/* eslint-disable valid-jsdoc */

function compressedPoint(p) {
  const x = p.getX().toArray();
  const y = p.getY();
  while (x.length < 32) x.unshift(0)
  return [y.isEven() ? 0x02 : 0x03].concat(x);
}

/**
* @param {Object} [options] -
* @param {Number} [options.accountIndex=0] - the account number to generate
* @param {Boolean} [options.root=false] - generate root key-pair,
*                                         as used by validators.
* @return {new bn.js} -
*
*/

/* eslint-enable valid-jsdoc */
function derivek256Secret(seed, options) {
  if (!seed.is_valid()) {
    throw new Error('Cannot generate keys from invalid seed!');
  }

  const opts = options || {};
  const root = opts.root;
  const order = Ec256k1.curve.n;

  // This private generator represents the `root` private key, and is what's
  // used by validators for signing when a keypair is generated from a seed.
  const privateGen = findk256Key(seed.to_bytes());
  let secret;

  if (root) {
    // As used by validation_create
    secret = privateGen;
  } else {
    const publicGen = Ec256k1.g.mul(privateGen);

    // A seed can generate many keypairs as a function of the seed and a uint32.
    // Almost everyone just uses the first account, `0`.
    const accountIndex = opts.accountIndex || 0;
    secret = findk256Key(compressedPoint(publicGen), accountIndex)
                            .add(privateGen).mod(order);
  }
  return secret;
}

function bytesBnTo256Bits(bytes) {
  while (bytes.length < 32) bytes.unshift(0);
}

function createAccountId(pubKeyBytes) {
  const hash256 = hashjs.sha256().update(pubKeyBytes).digest()
  const hash160 = hashjs.ripemd160().update(hash256).digest();
  const id = UInt160.from_bytes(hash160);
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
@param {Array<Byte>} message
@param {Array<Byte>} signature
@virtual
 */
KeyPair.prototype.verify = isVirtual;

/*
@return {Array<Byte>} of bytes, in canonical form, for signing
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
function Ed25519Pair(derived) {
  KeyPair.apply(this, arguments);
  this.derived = derived;
  this.publicKey = derived.encoded.A;
  this.type = KeyType.ed25519;
}

util.inherits(Ed25519Pair, KeyPair);

/**
* @param {Seed} seed - A 128 bit seed
* @return {Ed25519Pair} key pair
*/
Ed25519Pair.fromSeed = function(seed) {
  const seed256 = deriveEdKeyPairSeed(seed);
  const derived = Ed25519.deriveFromSeed(seed256);
  return new Ed25519Pair(derived);
};

hasCachedProperty(Ed25519Pair, 'pubKeyBytes', function() {
  return [0xED].concat(this.publicKey);
});

Ed25519Pair.prototype.sign = function(message) {
  return Ed25519.sign(message, this.derived);
};

Ed25519Pair.prototype.verify = function(message, signature) {
  return Ed25519.verify(signature, message, this.publicKey);
};

/* ---------------------------- SECP256K1 KEYPAIR --------------------------- */

/*
* @class
* @private
*/
function Secp256k1Pair(keyPair) {
  KeyPair.apply(this, arguments);
  this.type = KeyType.secp256k1;
  this.keyPair = keyPair
}

util.inherits(Secp256k1Pair, KeyPair);

Secp256k1Pair.fromSeed = function(seed) {
  return new Secp256k1Pair(Ec256k1.keyFromPrivate(derivek256Secret(seed)));
};

hasCachedProperty(Secp256k1Pair, 'pubKeyBytes', function() {
  return this.keyPair.getPublic(/*compact*/ true, /*enc*/ 'bytes');
});

hasCachedProperty(Secp256k1Pair, 'sjclSecret', function(sjcl) {
  const curve = sjcl.ecc.curves.k256;
  const secret = this.keyPair.priv.toString('hex');
  return new sjcl.ecc.ecdsa.secretKey(curve, new sjcl.bn(secret));
});

/*
@param {Array<Byte>} message (bytes)
 */
Secp256k1Pair.prototype.sign = function(message) {
  return Ec256k1.sign(this.hashMessage(message),
                      this.keyPair,
                      {canonical: true}).toDER();
};

/*
@param {Array<Byte>} message (bytes)
@return {Array<Byte>} 256 bit hash of the message
 */
Secp256k1Pair.prototype.hashMessage = function(message) {
  return hashjs.sha512().update(message).digest().slice(0, 32);
};

/*
@param {Array<Byte>} message - bytes
@param {Array<Byte>} signature - DER encoded signature bytes
 */
Secp256k1Pair.prototype.verify = function(message, signature) {
  try {
    return Ec256k1.verify(this.hashMessage(message),
                          signature,
                          this.pubKeyBytes());
  } catch (e) {
    return false;
  }
};

exports.getKeyPair = function(specifier) {
  // TODO: take seed, or base58 encoded secretKey
  if (specifier instanceof KeyPair) {
    return specifier;
  }

  const isGeneric = typeof specifier === 'string';
  const specifierObj = isGeneric ? {} : specifier;
  let keyType = specifierObj.key_type;

  if (isGeneric) {
    specifierObj.generic = arguments[0];
  }
  if (!keyType) {
    keyType = KeyType.secp256k1;
  }

  const seed = parseSeed(specifierObj);
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
