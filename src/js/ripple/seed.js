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

var Sha512 = utils.Sha512;

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

Seed.prototype.get_key = function(opts) {
  if (opts !== undefined && typeof opts !== 'object') {
    throw new Error('get_key options not supported: ' + opts);
  }
  return this._get_key(opts);
};

/**
* @return {KeyPair} - the root key-pair, as used by validators.
*/
Seed.prototype.get_root_key = function() {
  return this._get_key({root: true});
};

/**
* @param {Object} [options] -
*
* @param {Number} [options.accountIndex=0] - the account number to generate
*
* @param {Boolean} [options.root=false] - generate root key-pair,
*                                         as used by validators.
* @return {KeyPair} -
*/
Seed.prototype._get_key = function(options) {
  var opts = options || {};

  var root = opts.root;

  if (!this.is_valid()) {
    throw new Error('Cannot generate keys from invalid seed!');
  }

  var privateGen, publicGen;
  var curve = this._curve;
  var i = 0;

  do {
    // We hash the seed to extend from 128 bits to 256, looping until we are
    // sure the 256 bits represents a number that is situated on the curve.
    privateGen = new Sha512().add(this.to_bytes()).addU32(i).finish256BN();

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
    // A seed can generate many keypairs as a function of the seed and a uint32.
    // Almost everyone just uses the first account, `0`,
    var accountIndex = opts.accountIndex || 0;
    do {
      // We hash the root key-pair's public key bytes, along with the account
      // number to deterministically find another point on the curve.
      secret = new Sha512().add(publicGen.toBytesCompressed())
                           .addU32(accountIndex).addU32(i).finish256BN();
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
