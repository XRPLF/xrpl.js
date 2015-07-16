'use strict';

//
// Seed support
//

const {Secp256k1Pair, Ed25519Pair} = require('ripple-keypairs');
const extend = require('extend');
const utils = require('./utils');

const sjcl = utils.sjcl;

const Base = require('./base').Base;
const UInt = require('./uint').UInt;
const UInt160 = require('./uint160').UInt160;

const Seed = extend(function() {
  this._curve = sjcl.ecc.curves.k256;
  this._value = NaN;
  this._version = Base.VER_FAMILY_SEED;
}, UInt);

Seed.width = 16;
Seed.prototype = extend({}, UInt.prototype);
Seed.prototype.constructor = Seed;
Seed.versions = [Base.VER_FAMILY_SEED, Base.VER_ED25519_SEED];

// Backwards compatibility hack
Secp256k1Pair.prototype.get_address =
Ed25519Pair.prototype.get_address = function() {
  const id = UInt160.from_bytes(this.accountBytes());
  id.set_version(Base.VER_ACCOUNT_ID);
  return id;
};

// value = NaN on error.
// One day this will support rfc1751 too.
Seed.prototype.parse_json = function(j) {
  if (typeof j === 'string') {
    if (!j.length) {
      this._value = NaN;
    // XXX Should actually always try and continue if it failed.
    } else if (j[0] === 's') {
      const decoded = Base.decode_multi(Seed.versions, j, 16);
      if (decoded.value) {
        this._value = decoded.value;
        this._version = decoded.version;
      } else {
        this._value = NaN;
      }
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

Seed.prototype.set_ed25519 = function() {
  this._version = Base.VER_ED25519_SEED;
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

Seed.prototype.to_json = function() {
  if (!(this.is_valid())) {
    return NaN;
  }

  const output = Base.encode_check(this._version, this.to_bytes());

  return output;
};

Seed.prototype.get_key = function() {
  if (!this.is_valid()) {
    throw new Error('Cannot generate keys from invalid seed!');
  }
  const seedBytes = this.to_bytes();
  const pairType = this._version === Base.VER_FAMILY_SEED ? Secp256k1Pair :
                                                            Ed25519Pair;
  return pairType.fromSeed(seedBytes);
};

exports.Seed = Seed;
