'use strict';

const BigNum = require('bn.js');
const hashjs = require('hash.js');

function isVirtual() {
  throw new Error('virtual method not implemented ');
}

function hasCachedProperty(obj, name, computer) {
  const key = name + '__';
  obj.prototype[name] = function() {
    let cached = this[key];
    if (cached === undefined) {
      cached = this[key] = computer.apply(this, arguments);
    }
    return cached;
  };
}

function arrayToHex(a) {
  return a.map(function(byteValue) {
    const hex = byteValue.toString(16).toUpperCase();
    return hex.length > 1 ? hex : '0' + hex;
  }).join('');
}

function toGenericArray(sequence) {
  const generic = [];
  for (let i = 0; i < sequence.length; i++) {
    generic.push(sequence[i]);
  }
  return generic;
}

function bytesToHex(bytes) {
  return arrayToHex(bytes);
}

class Sha512 {
  constructor() {
    this.hash = hashjs.sha512();
  }
  add(bytes) {
    this.hash.update(bytes);
    return this;
  }
  addU32(i) {
    return this.add([(i >>> 24) & 0xFF, (i >>> 16) & 0xFF,
                     (i >>> 8) & 0xFF, i & 0xFF]);
  }
  finish() {
    return this.hash.digest();
  }
  first256() {
    return this.finish().slice(0, 32);
  }
  first256BN() {
    return new BigNum(this.first256());
  }
}

function seedFromPhrase(phrase) {
  return hashjs.sha512().update(phrase).digest().slice(0, 16);
}

function createAccountID(pubKeyBytes) {
  const hash256 = hashjs.sha256().update(pubKeyBytes).digest();
  const hash160 = hashjs.ripemd160().update(hash256).digest();
  return hash160;
}

module.exports = {
  arrayToHex,
  bytesToHex,
  hasCachedProperty,
  isVirtual,
  Sha512,
  toGenericArray,
  seedFromPhrase,
  createAccountID
};
