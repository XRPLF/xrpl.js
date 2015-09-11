'use strict';

//
// Seed support
//

const extend = require('extend');
const utils = require('./utils');
const sjcl = utils.sjcl;

const Base = require('./base').Base;
const UInt = require('./uint').UInt;
const UInt160 = require('./uint160').UInt160;
const KeyPair = require('./keypair').KeyPair;

const Seed = extend(function() {
  this._curve = sjcl.ecc.curves.k256;
  this._value = NaN;
}, UInt);

Seed.width = 16;
Seed.prototype = Object.create(extend({}, UInt.prototype));
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

  const hash = sjcl.hash.sha512.hash(sjcl.codec.utf8String.toBits(j));
  const bits = sjcl.bitArray.bitSlice(hash, 0, 128);

  this.parse_bits(bits);

  return this;
};

Seed.prototype.to_json = function() {
  if (!(this.is_valid())) {
    return NaN;
  }

  const output = Base.encode_check(Base.VER_FAMILY_SEED, this.to_bytes());

  return output;
};

function append_int(a, i) {
  return [].concat(a, i >> 24, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff);
}

function firstHalfOfSHA512(bytes) {
  return sjcl.bitArray.bitSlice(
    sjcl.hash.sha512.hash(sjcl.codec.bytes.toBits(bytes)),
    0, 256
  );
}

// Removed a `*` so this JSDoc-ish syntax is ignored.
// This will soon all change anyway.
/*
* @param account
*        {undefined}                 take first, default, KeyPair
*
*        {Number}                    specifies the account number of the KeyPair
*                                    desired.
*
*        {Uint160} (from_json able), specifies the address matching the KeyPair
*                                    that is desired.
*
* @param maxLoops (optional)
*        {Number}                    specifies the amount of attempts taken
*                                    to generate a matching KeyPair
*
*/
Seed.prototype.get_key = function(account, maxLoops) {
  let account_number = 0, address;
  let max_loops = maxLoops || 1;

  if (!this.is_valid()) {
    throw new Error('Cannot generate keys from invalid seed!');
  }
  if (account) {
    if (typeof account === 'number') {
      account_number = account;
      max_loops = account_number + 1;
    } else {
      address = UInt160.from_json(account);
    }
  }

  let private_gen, public_gen;
  const curve = this._curve;
  let i = 0;

  do {
    private_gen = sjcl.bn.fromBits(
            firstHalfOfSHA512(append_int(this.to_bytes(), i)));
    i++;
  } while (!curve.r.greaterEquals(private_gen));

  public_gen = curve.G.mult(private_gen);

  let sec;
  let key_pair;

  do {

    i = 0;

    do {
      sec = sjcl.bn.fromBits(
              firstHalfOfSHA512(
                  append_int(
                    append_int(public_gen.toBytesCompressed(), account_number)
                    ,
                    i
                  )));
      i++;
    } while (!curve.r.greaterEquals(sec));

    account_number++;
    sec = sec.add(private_gen).mod(curve.r);
    key_pair = KeyPair.from_bn_secret(sec);

    if (max_loops-- <= 0) {
      // We are almost certainly looking for an account that would take same
      // value of $too_long {forever, ...}
      throw new Error('Too many loops looking for KeyPair yielding ' +
                      address.to_json() + ' from ' + this.to_json());
    }

  } while (address && !key_pair.get_address().equals(address));

  return key_pair;
};

exports.Seed = Seed;
