'use strict';

/*eslint new-cap: 1*/

//
// Seed support
//

var extend = require('extend');
var utils = require('./utils');
var sjcl = utils.sjcl;

var Base = require('./base').Base;
var UInt = require('./uint').UInt;
var KeyPair = require('./keypair').KeyPair;

var Seed = extend(function() {
  this._curve = sjcl.ecc.curves.k256;
  this._value = NaN;
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
      this._value = Base.decode_check(Base.VER_FAMILY_SEED, j);
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

  var hash = sjcl.hash.sha512.hash(sjcl.codec.utf8String.toBits(j));
  var bits = sjcl.bitArray.bitSlice(hash, 0, 128);

  this.parse_bits(bits);

  return this;
};

Seed.prototype.to_json = function() {
  if (!(this.is_valid())) {
    return NaN;
  }

  var output = Base.encode_check(Base.VER_FAMILY_SEED, this.to_bytes());

  return output;
};

function Sha512() {
  this.hash = new sjcl.hash.sha512();
}

Sha512.prototype.add = function(bytes) {
  this.hash.update(sjcl.codec.bytes.toBits(bytes));
  return this;
};

Sha512.prototype.add32 = function(i) {
  this.hash.update([i]);
  return this;
};

Sha512.prototype.finish = function() {
  return this.hash.finalize();
};

Sha512.prototype.finish256 = function() {
  return sjcl.bitArray.bitSlice(this.finish(), 0, 256);
};

Sha512.prototype.finish256BN = function() {
  return sjcl.bn.fromBits(this.finish256());
};

Seed.prototype.get_key = function() {
  if (arguments.length !== 0) {
    throw new Error('Account families are no long supported. ' +
                    'The first account for each seed is always taken.');
  }
  return this._get_key(false);
};

/**
* @return {KeyPair} - the root key-pair, as used by validators.
*/
Seed.prototype.get_root_key = function() {
  return this._get_key(true);
};

Seed.prototype._get_key = function(root) {
  if (!this.is_valid()) {
    throw new Error('Cannot generate keys from invalid seed!');
  }

  var privateGen, publicGen;
  var curve = this._curve;
  var i = 0;

  do {
    // We hash the seed to extend from 128 bits to 256, looping until we are
    // sure the 256 bits represents a number that is situated on the curve.
    privateGen = new Sha512().add(this.to_bytes()).add32(i).finish256BN();

    // This private generator, represents the `root` private key, and is what's
    // used by validators for signing when a keypair is generated from a seed.
    i++;
  } while (!curve.r.greaterEquals(privateGen));

  var secret;

  if (root) {
    // As used by validation_create
    secret = privateGen;
  } else {
    publicGen = curve.G.mult(privateGen);
    i = 0;
    // Previously there was an `account families` feature, where a seed could
    // generate many keypairs (as a function of the seed and a uint32). This
    // gained little use and the feature was removed, as everyone just used the
    // first account, `0`.
    var accountNumber = 0;
    do {
      // We hash the root key-pair's public key bytes, along with the account
      // number to deterministically find another point on the curve.
      secret = new Sha512().add(publicGen.toBytesCompressed())
                           .add32(accountNumber).add32(i).finish256BN();
      i++;

    // Again, we make sure the value is situated on the curve. The `i` sequence
    // was incremented so next time we try we'll have a new hash.
    } while (!curve.r.greaterEquals(secret));

    // The final operation:
    secret = secret.add(privateGen).mod(curve.r);
  }
  // The public key is lazily computed by the key class, but it has the same
  // mathematical relationship to `secret` as `publicGen` to `privateGen`.
  return KeyPair.from_bn_secret(secret);
};

exports.Seed = Seed;
