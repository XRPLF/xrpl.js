'use strict';

const elliptic = require('elliptic');
const {utils: {parseBytes}} = elliptic;
const Ed25519 = elliptic.eddsa('ed25519');
const {KeyPair, KeyType} = require('./keypair');
const {Sha512, cached} = require('./utils');

/*
@param {Array} seed bytes
 */
function deriveEdKeyPairSeed(seed) {
  return new Sha512().add(seed).first256();
}

class Ed25519Pair extends KeyPair {
  constructor(options) {
    super(options);
    this.type = KeyType.ed25519;
  }

  /**
  * @param {String|Array} publicKey - public key in canonical form
  *                                   (0xED + 32 bytes)
  * @return {Ed25519Pair} key pair
  */
  static fromPublic(publicKey) {
    return new Ed25519Pair({pubBytes: parseBytes(publicKey)});
  }

  /**
  * @param {Array<Number>} seedBytes - A 128 bit seed
  * @return {Ed25519Pair} key pair
  */
  static fromSeed(seedBytes) {
    return new Ed25519Pair({seedBytes});
  }

  sign(message) {
    return this.key().sign(message).toBytes();
  }

  verify(message, signature) {
    return this.key().verify(message, signature);
  }

  @cached
  key() {
    if (this.seedBytes) {
      const seed256 = deriveEdKeyPairSeed(this.seedBytes);
      return Ed25519.keyFromSecret(seed256);
    }
    return Ed25519.keyFromPublic(this.pubKeyCanonicalBytes().slice(1));
  }

  @cached
  pubKeyCanonicalBytes() {
    return [0xED].concat(this.key().pubBytes());
  }
}

module.exports = {
  Ed25519Pair
};
