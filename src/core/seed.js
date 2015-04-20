'use strict';

/*eslint new-cap: 1*/

//
// Seed support
//

const extend = require('extend');
const lodash = require('lodash');
const utils = require('./utils');
const sjcl = utils.sjcl;

const Base = require('./base').Base;
const UInt = require('./uint').UInt;

const Sha512 = utils.Sha512;

const Seed = extend(function() {
  this._curve = sjcl.ecc.curves.k256;
  this._value = NaN;
  this._version = Base.VER_FAMILY_SEED;
}, UInt);

Seed.width = 16;
Seed.prototype = extend({}, UInt.prototype);
Seed.prototype.constructor = Seed;

// value = NaN on error.
// One day this will support rfc1751 too.
Seed.prototype.parse_json = function(j) {
  if (typeof j === 'string') {
    if (!j.length) {
      this._value = NaN;
    // XXX Should actually always try and continue if it failed.
    } else if (j[0] === 's') {
      this.parse_base58(j);
    } else if (/^[0-9a-fA-f]{32}$/.test(j)) {
      this.parse_hex(j);
    // XXX Should also try 1751
    } else {
      this.parse_passphrase(j);
    }
  } else {
    this._value = NaN;
  }

  return this;
};

Seed.prototype.parse_passphrase = function(j) {
  if (typeof j !== 'string') {
    throw new Error('Passphrase must be a string');
  }

  const hash = sjcl.hash.sha512.hash(sjcl.codec.utf8String.toBits(j));
  const bits = sjcl.bitArray.bitSlice(hash, 0, 128);

  this.parse_bits(bits);

  return this;
};

Seed.prototype.parse_base58 = function(j) {
  const result = Base.decode_multi(j, Seed.width, [Base.VER_FAMILY_SEED,
                                                 Base.VER_ED25519_SEED]);

  if (!result.bytes) {
    this._value = NaN;
  } else {
    this._version = result.version;
    this._value = sjcl.bn.fromBits(sjcl.codec.bytes.toBits(result.bytes));
  }

  return this;
};

Seed.prototype.to_json = function() {
  if (!(this.is_valid())) {
    return NaN;
  }

  const version = this._version;
  const output = Base.encode_check(version, this.to_bytes());

  return output;
};

Seed.prototype.get_key = function() {
  throw new Error('Use keypairs.getKeyPair() instead');
};

exports.Seed = Seed;
