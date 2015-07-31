'use strict';

const codec = require('ripple-address-codec');
const {
  bytesToHex,
  hasCachedProperty,
  isVirtual,
  createAccountID
} = require('./utils');

const KeyType = {
  secp256k1: 'secp256k1',
  ed25519: 'ed25519'
};

function KeyPair({seedBytes, pubBytes}) {
  this.seedBytes = seedBytes;
  this.pubKeyCanonicalBytes__ = pubBytes;
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

hasCachedProperty(KeyPair, 'pubKeyHex', function() {
  return bytesToHex(this.pubKeyCanonicalBytes());
});

hasCachedProperty(KeyPair, 'accountBytes', function() {
  return createAccountID(this.pubKeyCanonicalBytes());
});

hasCachedProperty(KeyPair, 'accountID', function() {
  return codec.encodeAccountID(this.accountBytes());
});

hasCachedProperty(KeyPair, 'seed', function() {
  return codec.encodeSeed(this.seedBytes, this.type);
});

KeyPair.prototype.signHex = function(message) {
  return bytesToHex(this.sign(message));
};

module.exports = {
  KeyPair,
  KeyType
};
