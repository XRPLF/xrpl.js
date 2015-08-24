'use strict';
const assert = require('assert');
const hashjs = require('hash.js');
const BN = require('bn.js');
const Sha512 = require('./sha512');

function unused() {}

function isVirtual(_, __, descriptor) {
  unused(_, __);

  descriptor.value = function() {
    throw new Error('virtual method not implemented ');
  };
}

function cached(_, name, descriptor) {
  unused(_);

  const computer = descriptor.value;
  const key = '_' + name;
  descriptor.value = function() {
    let value = this[key];
    if (value === undefined) {
      value = this[key] = computer.call(this);
    }
    return value;
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
  cached,
  bytesToHex,
  hexToBytes,
  computePublicKeyHash,
  isVirtual,
  seedFromPhrase,
  Sha512,
  toGenericArray
};
