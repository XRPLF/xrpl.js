'use strict';

const util = require('util');
const elliptic = require('elliptic');
const {utils: {parseBytes}} = elliptic;
const Ed25519 = elliptic.eddsa('ed25519');
const {KeyPair, KeyType} = require('./keypair');
const {
  Sha512,
  hasCachedProperty,
} = require('./utils');

/*
@param {Array} seed bytes
 */
function deriveEdKeyPairSeed(seed) {
  return new Sha512().add(seed).first256();
}

/*
* @class
*/
function Ed25519Pair() {
  KeyPair.apply(this, arguments);
  this.type = KeyType.ed25519;
}

util.inherits(Ed25519Pair, KeyPair);

/**
* @param {Array<Number>} seedBytes - A 128 bit seed
* @return {Ed25519Pair} key pair
*/
Ed25519Pair.fromSeed = function(seedBytes) {
  return new Ed25519Pair({seedBytes});
};

/**
* @param {Seed} publicKey - public key in canonical form (0xED + 32 bytes)
* @return {Ed25519Pair} key pair
*/
Ed25519Pair.fromPublic = function(publicKey) {
  return new Ed25519Pair({pubBytes: parseBytes(publicKey)});
};

hasCachedProperty(Ed25519Pair, 'key', function() {
  if (this.seedBytes) {
    const seed256 = deriveEdKeyPairSeed(this.seedBytes);
    return Ed25519.keyFromSecret(seed256);
  }
  return Ed25519.keyFromPublic(this.pubKeyCanonicalBytes().slice(1));
});

hasCachedProperty(Ed25519Pair, 'pubKeyCanonicalBytes', function() {
  return [0xED].concat(this.key().pubBytes());
});

Ed25519Pair.prototype.sign = function(message) {
  return this.key().sign(message).toBytes();
};

Ed25519Pair.prototype.verify = function(message, signature) {
  return this.key().verify(message, signature);
};

module.exports = {
  Ed25519Pair
};
