'use strict';

var sjcl = require('sjcl');

/* eslint-disable no-undef */
/* eslint-disable block-scoped-var */
/* eslint-disable new-cap */
/* eslint-disable valid-jsdoc */

var BITS_ONE_BYTE = sjcl.codec.bytes.toBits([0x01]);
var BITS_ZERO_BYTE = sjcl.codec.bytes.toBits([0x00]);
var BITS_32_ZERO_BYTES = sjcl.codec.bytes.toBits(arrayFill(32, 0));
var BITS_32_ONE_BYTES = sjcl.codec.bytes.toBits(arrayFill(32, 1));

function arrayFill(n, fill) {
  var arr = new Array(n);
  for (var i = 0; i < n; i++) {
    arr[i] = fill;
  }
  return arr;
}

function isZero(bn) {
  return bn.limbs.length === 1 && bn.limbs[0] === 0;
}

function isPointInfinity(affine) {
  var jac = affine.toJac();
  return isZero(jac.z) && !isZero(jac.y);
}

function sha256Mac(k) {
  var hmac = new sjcl.misc.hmac(k, sjcl.hash.sha256);
  Array.prototype.slice.call(arguments, 1).forEach(hmac.update.bind(hmac));
  return hmac.digest();
}

// https://tools.ietf.org/html/rfc6979#section-3.2
/**
* @param {sjcl.bitArray} hash - the hash of the message
* @param {sjcl.bn} d - the private key
* @param {Function} isValid - a function that checks that r/s from k is valid
*/
sjcl.ecc.ecdsa.secretKey.prototype.generateDeterministicK =
  function(hash, isValid) {
  var curve_ = this._curve;
  var qlen = curve_.r.bitLength();

  if (qlen !== 256) {
    throw new Error('only works for curves with order bitLength of 256');
  }

  var x = this._exponent.toBits(qlen); // qlen
  var k = BITS_32_ZERO_BYTES;
  var v = BITS_32_ONE_BYTES;
  var T;

  k = sha256Mac(k, v, BITS_ZERO_BYTE, x, hash);
  v = sha256Mac(k, v);
  k = sha256Mac(k, v, BITS_ONE_BYTE, x, hash);

  function setT() {
    v = sha256Mac(k, v);
    v = sha256Mac(k, v);
    T = sjcl.bn.fromBits(v);
  }

  setT();

  while (!T.greaterEquals(1) || !curve_.r.greaterEquals(T) || !isValid(T)) {
    k = sha256Mac(k, v, BITS_ZERO_BYTE);
    setT();
  }

  return T;
};

sjcl.ecc.ecdsa.secretKey.prototype.signDeterministic = function(hash) {
  var curve = this._curve;
  var n = curve.r; // order
  var G = curve.G;
  var l = n.bitLength();

  var r, s;
  var e = sjcl.bn.fromBits(hash);
  var d = this._exponent;

  this.generateDeterministicK(hash, function(k) {
    var Q = G.mult(k);
    if (isPointInfinity(Q)) {
      return false;
    }
    r = Q.x.mod(n);
    if (isZero(r)) {
      return false;
    }
    s = e.add(r.mul(d)).mul(k.inverseMod(n)).mod(n);
    if (isZero(s)) {
      return false;
    }
    return true;
  });
  return sjcl.bitArray.concat(r.toBits(l), s.toBits(l));
};


sjcl.ecc.ecdsa.secretKey.prototype.sign =
  function(hash, paranoia, k_for_testing) {
  var R = this._curve.r,
      l = R.bitLength();

  // k_for_testing should ONLY BE SPECIFIED FOR TESTING
  // specifying it will make the signature INSECURE
  var k;

  if (typeof k_for_testing === 'object' && k_for_testing.length > 0
      && typeof k_for_testing[0] === 'number') {
    k = k_for_testing;
  } else if (typeof k_for_testing === 'string'
             && /^[0-9a-fA-F]+$/.test(k_for_testing)) {
    k = sjcl.bn.fromBits(sjcl.codec.hex.toBits(k_for_testing));
  } else {
    // This is the only option that should be used in production
    k = sjcl.bn.random(R.sub(1), paranoia).add(1);
  }

  var r = this._curve.G.mult(k).x.mod(R);
  var s = sjcl.bn.fromBits(hash).add(r.mul(this._exponent))
  .mul(k.inverseMod(R)).mod(R);

  return sjcl.bitArray.concat(r.toBits(l), s.toBits(l));
};

sjcl.ecc.ecdsa.publicKey.prototype.verify = function(hash, rs) {
  var w = sjcl.bitArray,
      R = this._curve.r,
      l = R.bitLength(),
      r = sjcl.bn.fromBits(w.bitSlice(rs, 0, l)),
      s = sjcl.bn.fromBits(w.bitSlice(rs, l, 2 * l)),
      sInv = s.inverseMod(R),
      hG = sjcl.bn.fromBits(hash).mul(sInv).mod(R),
      hA = r.mul(sInv).mod(R),
      r2 = this._curve.G.mult2(hG, hA, this._point).x;

  if (r.equals(0) || s.equals(0) || r.greaterEquals(R)
      || s.greaterEquals(R) || !r2.equals(r)) {
    throw (new sjcl.exception.corrupt('signature didn\'t check out'));
  }

  return true;
};
