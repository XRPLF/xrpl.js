/* -------------------------------- REQUIRES -------------------------------- */

const bnjs = require('bn.js');
const hashjs = require('hash.js');

function isVirtual() {
  throw new Error('virtual method not implemented ');
}

function hasCachedProperty(obj, name, computer) {
  const key = name + '__';
  obj.prototype[name] = function() {
    let cached = this[key];
    if(cached === undefined) {
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

function toGenericArray(typedArray) {
  const generic = [];
  Array.prototype.push.apply(generic, typedArray);
  return generic;
}

function bytesToHex(bytes) {
  return arrayToHex(bytes);
}

class Sha512 {
  constructor () {
    this.hash = hashjs.sha512();
  }
  add (bytes) {
    this.hash.update(bytes);
    return this;
  }
  addU32 (i) {
    return this.add([(i >>> 24) & 0xFF, (i >>> 16) & 0xFF,
                     (i >>> 8)  & 0xFF,  i         & 0xFF ]);
  }
  finish () {
    return this.hash.digest();
  }
  finish256 () {
    return this.finish().slice(0, 32);
  }
  finish256BN () {
    return new bnjs(this.finish256());
  }
}

module.exports = {
  arrayToHex,
  bytesToHex,
  hasCachedProperty,
  isVirtual,
  Sha512,
  toGenericArray
}