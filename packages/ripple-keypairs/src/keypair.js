'use strict';

const codec = require('ripple-address-codec');
const {
  bytesToHex,
  cached,
  isVirtual,
  computePublicKeyHash
} = require('./utils');

const KeyType = {
  secp256k1: 'secp256k1',
  ed25519: 'ed25519'
};

class KeyPair {
  constructor({seedBytes, pubBytes}) {
    this.seedBytes = seedBytes;
    this._pubKeyCanonicalBytes = pubBytes;
  }

  /*
  * @param {Array} message
  */
  @isVirtual
  sign() {}

  /*
  * @param {Array<Byte>} message
  * @param {Array<Byte>} signature
  */
  @isVirtual
  verify() {}

  /*
  * @return {Array<Byte>} of bytes, in canonical form, for signing
  */
  @isVirtual
  pubKeyCanonicalBytes() {}

  @cached
  pubKeyHex() {
    return bytesToHex(this.pubKeyCanonicalBytes());
  }

  @cached
  accountBytes() {
    return computePublicKeyHash(this.pubKeyCanonicalBytes());
  }

  @cached
  accountID() {
    return codec.encodeAccountID(this.accountBytes());
  }

  @cached
  seed() {
    return codec.encodeSeed(this.seedBytes, this.type);
  }

  signHex(message) {
    return bytesToHex(this.sign(message));
  }
}

module.exports = {
  KeyPair,
  KeyType
};
