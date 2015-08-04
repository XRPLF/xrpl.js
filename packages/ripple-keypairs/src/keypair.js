'use strict';

const codec = require('ripple-address-codec');
const {
  bytesToHex,
  cachedProperty,
  isVirtual,
  createAccountID
} = require('./utils');

const KeyType = {
  secp256k1: 'secp256k1',
  ed25519: 'ed25519'
};

function KeyPair({seedBytes, pubBytes}) {
  this.seedBytes = seedBytes;
  this._pubKeyCanonicalBytes = pubBytes;
}

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

cachedProperty(KeyPair, function pubKeyHex() {
  return bytesToHex(this.pubKeyCanonicalBytes());
});

cachedProperty(KeyPair, function accountBytes() {
  return createAccountID(this.pubKeyCanonicalBytes());
});

cachedProperty(KeyPair, function accountID() {
  return codec.encodeAccountID(this.accountBytes());
});

cachedProperty(KeyPair, function seed() {
  return codec.encodeSeed(this.seedBytes, this.type);
});

KeyPair.prototype.signHex = function(message) {
  return bytesToHex(this.sign(message));
};

module.exports = {
  KeyPair,
  KeyType
};
