'use strict';

const hashjs = require('hash.js');
const Sha512 = require('./sha512');

function isVirtual() {
  throw new Error('virtual method not implemented ');
}

function cachedProperty(obj, computer) {
  const name = computer.name;
  const key = '_' + name;
  obj.prototype[name] = function() {
    let cached = this[key];
    if (cached === undefined) {
      cached = this[key] = computer.call(this);
    }
    return cached;
  };
}

function toGenericArray(sequence) {
  const generic = [];
  for (let i = 0; i < sequence.length; i++) {
    generic.push(sequence[i]);
  }
  return generic;
}

function bytesToHex(a) {
  return a.map(function(byteValue) {
    const hex = byteValue.toString(16).toUpperCase();
    return hex.length > 1 ? hex : '0' + hex;
  }).join('');
}

function createAccountID(pubKeyBytes) {
  const hash256 = hashjs.sha256().update(pubKeyBytes).digest();
  const hash160 = hashjs.ripemd160().update(hash256).digest();
  return hash160;
}

function seedFromPhrase(phrase) {
  return hashjs.sha512().update(phrase).digest().slice(0, 16);
}

module.exports = {
  bytesToHex,
  cachedProperty,
  createAccountID,
  isVirtual,
  seedFromPhrase,
  Sha512,
  toGenericArray
};
