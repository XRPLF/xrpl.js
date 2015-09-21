'use strict';
const assert = require('assert');
const hashjs = require('hash.js');
const BN = require('bn.js');

function bytesToHex(a) {
  return a.map(function(byteValue) {
    const hex = byteValue.toString(16).toUpperCase();
    return hex.length > 1 ? hex : '0' + hex;
  }).join('');
}

function hexToBytes(a) {
  assert(a.length % 2 === 0);
  return (new BN(a, 16)).toArray(null, a.length / 2);
}

function computePublicKeyHash(publicKeyBytes) {
  const hash256 = hashjs.sha256().update(publicKeyBytes).digest();
  const hash160 = hashjs.ripemd160().update(hash256).digest();
  return hash160;
}

function seedFromPhrase(phrase) {
  return hashjs.sha512().update(phrase).digest().slice(0, 16);
}

module.exports = {
  bytesToHex,
  hexToBytes,
  computePublicKeyHash,
  seedFromPhrase
};
