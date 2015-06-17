'use strict';

/* -------------------------------- REQUIRES -------------------------------- */

const util = require('util');
const elliptic = require('elliptic');
const bnjs = require('bn.js');
const hashjs = require('hash.js');
const codec = require('ripple-address-codec');

// elliptic
const secp256k1 = elliptic.ec('secp256k1');
const Ed25519 = elliptic.eddsa('ed25519');

const {
  arrayToHex,
  bytesToHex,
  hasCachedProperty,
  isVirtual,
  Sha512,
  toGenericArray
} = require('./utils');

/* ---------------------------------- ENUMS --------------------------------- */

const KeyType = {
  secp256k1: 'secp256k1',
  ed25519: 'ed25519'
};

/* ----------------------------- KEY DERIVATION ----------------------------- */

function seedFromPhrase(phrase) {
  return hashjs.sha512().update(phrase).digest().slice(0, 16);
}

function findk256Key(bytes, discrim) {
  const order = secp256k1.curve.n;
  for (let i = 0; i <= 0xFFFFFFFF; i++) {
    // We hash the bytes to find a 256 bit number, looping until we are sure it
    // is less than the order of the curve.
    const hasher = new Sha512().add(bytes);
    // If the optional discriminator index was passed in, update the hash.
    if (discrim !== undefined) {
      hasher.addU32(discrim);
    }
    hasher.addU32(i);
    const key = hasher.finish256BN();
    if (key.cmpn(0) > 0 && key.cmp(order) < 0) {
      return key;
    }
  }
  throw new Error('impossible unicorn ;)');
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
function derivek256Secret(seed, opts={}) {
  const root = opts.root;
  const order = secp256k1.curve.n;

  // This private generator represents the `root` private key, and is what's
  // used by validators for signing when a keypair is generated from a seed.
  const privateGen = findk256Key(seed);
  if (root) {
    // As returned by validation_create for a given seed
    return privateGen;
  }
  const publicGen = secp256k1.g.mul(privateGen);
  // A seed can generate many keypairs as a function of the seed and a uint32.
  // Almost everyone just uses the first account, `0`.
  const accountIndex = opts.accountIndex || 0;
  return findk256Key(compressedPoint(publicGen), accountIndex)
            .add(privateGen).mod(order);
}

function createAccountId(pubKeyBytes) {
  const hash256 = hashjs.sha256().update(pubKeyBytes).digest()
  const hash160 = hashjs.ripemd160().update(hash256).digest();
  return hash160;
}


/*
@private
@param {Array} seed bytes
 */
function deriveEdKeyPairSeed(seed) {
  return new Sha512().add(seed).finish256();
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
KeyPair.prototype.pubKeyCanonicalBytes = isVirtual;

hasCachedProperty(KeyPair, 'pubKeyHex', function() {
  return bytesToHex(this.pubKeyCanonicalBytes());
});

hasCachedProperty(KeyPair, 'accountBytes', function() {
  return createAccountId(this.pubKeyCanonicalBytes());
});

hasCachedProperty(KeyPair, 'accountID', function() {
  return codec.encodeAccountID(this.accountBytes());
});

KeyPair.prototype.signHex = function(message) {
  return bytesToHex(this.sign(message));
};

/* ---------------------------- SECP256K1 KEYPAIR --------------------------- */

/*
* @class
* @private
* @param {Object} - key
*/
function Ed25519Pair(key) {
  KeyPair.apply(this, arguments);
  this.key = key;
  this.type = KeyType.ed25519;
}

util.inherits(Ed25519Pair, KeyPair);

/**
* @param {Seed} seed - A 128 bit seed
* @return {Ed25519Pair} key pair
*/
Ed25519Pair.fromSeed = function(seed) {
  const seed256 = deriveEdKeyPairSeed(seed);
  const derived = Ed25519.keyFromSecret(seed256);
  return new Ed25519Pair(derived);
};

hasCachedProperty(Ed25519Pair, 'pubKeyCanonicalBytes', function() {
  return [0xED].concat(this.key.pubBytes());
});

Ed25519Pair.prototype.sign = function(message) {
  return this.key.sign(message).toBytes();
};

Ed25519Pair.prototype.verify = function(message, signature) {
  return this.key.verify(message, signature);
};

/* ---------------------------- SECP256K1 KEYPAIR --------------------------- */

/*
* @class
* @private
*/
function Secp256k1Pair(key) {
  KeyPair.apply(this, arguments);
  this.type = KeyType.secp256k1;
  this.key = key
}

util.inherits(Secp256k1Pair, KeyPair);

Secp256k1Pair.fromSeed = function(seed) {
  return new Secp256k1Pair(secp256k1.keyFromPrivate(derivek256Secret(seed)));
};

hasCachedProperty(Secp256k1Pair, 'pubKeyCanonicalBytes', function() {
  return this.key.getPublic(/*compact*/ true, /*enc*/ 'bytes');
});

/*
@param {Array<Byte>} message (bytes)
 */
Secp256k1Pair.prototype.sign = function(message) {
  return this.key.sign(this.hashMessage(message), {canonical: true}).toDER();
};

/*
@param {Array<Byte>} message (bytes)
 */
Secp256k1Pair.prototype.signMessage = function(message) {
  return this.key.sign(this.hashMessage(message), {canonical: true});
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
    return this.key.verify(this.hashMessage(message), signature);
  } catch (e) {
    return false;
  }
};

module.exports = {
  Secp256k1Pair,
  Ed25519Pair,
  KeyType,
  seedFromPhrase
}
