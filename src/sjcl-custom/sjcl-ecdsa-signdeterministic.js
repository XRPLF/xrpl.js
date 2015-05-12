'use strict';
let sjcl = require('sjcl');
/* eslint-disable new-cap */

sjcl.ecc.ecdsa.secretKey.prototype.generateK =
function(hash, hashObject) {

  let curve = this._curve;
  let qlen = sjcl.bitArray.bitLength(curve.r.toBits());

  /* Utility functions */
  /* used to generate k and v */
  function repeat(str, times) {
    return (new Array(times + 1)).join(str);
  }
  function bits2int(bits) {

    let blen = sjcl.bitArray.bitLength(bits);

    if (blen > qlen) {
      return sjcl.bn.fromBits(sjcl.bitArray.bitSlice(bits, 0, qlen));
    } else if (qlen < blen) {
      return sjcl.bn.fromBits(sjcl.bitArray.concat(
        sjcl.codec.hex.toBits(repeat('0', Math.ceil((qlen - blen) / 4))),
        curve.r.toBits()
      ));
    }
    return sjcl.bn.fromBits(bits);
  }
  function int2octets(integer) {
    let iModQ = integer.mulmod(new sjcl.bn(1), curve.r);

    let rlen = 8 * Math.ceil(qlen / 8);
    let ilen = sjcl.bitArray.bitLength(iModQ.toBits());

    return sjcl.bitArray.concat(
      sjcl.codec.hex.toBits(repeat('0', Math.ceil((rlen - ilen) / 4))),
      iModQ.toBits()
    );
  }
  function bits2octets(bits) {
    return int2octets(bits2int(bits).mulmod(new sjcl.bn(1), curve.r));
  }

  function hmac(bits, key) {
    let hmacK = new sjcl.misc.hmac(key, hashObject);
    return hmacK.encrypt(bits);
  }

  let hlen = sjcl.bitArray.bitLength(hash);
  let x = sjcl.bn.fromBits(this.get());

  let k = sjcl.codec.hex.toBits(repeat('00', Math.ceil(hlen / 8)));
  let v = sjcl.codec.hex.toBits(repeat('01', Math.ceil(hlen / 8)));

  k = hmac(
    sjcl.bitArray.concat(
      sjcl.bitArray.concat(v, sjcl.codec.hex.toBits('00')),
      sjcl.bitArray.concat(int2octets(x), bits2octets(hash))
    ),
    k
  );

  v = hmac(v, k);

  k = hmac(
    sjcl.bitArray.concat(
      sjcl.bitArray.concat(v, sjcl.codec.hex.toBits('01')),
      sjcl.bitArray.concat(int2octets(x), bits2octets(hash))
    ),
    k
  );

  v = hmac(v, k);
  v = hmac(v, k);

  let T = sjcl.bn.fromBits(v);

  while (
    sjcl.bitArray.bitLength(T.toBits()) < qlen
  ) {
    v = hmac(v, k);
    T = sjcl.bn.fromBits(sjcl.bitArray.concat(T.toBits(), v));
  }
  T = bits2int(T.toBits());

  while (!(T.greaterEquals(1)) || (T.greaterEquals(curve.r))) {
    k = hmac(
      sjcl.bitArray.concat(v, sjcl.codec.hex.toBits('00')),
      k
    );

    v = hmac(v, k);
    T = sjcl.bn.fromBits(v);
    while (
      sjcl.bitArray.bitLength(T.toBits()) < qlen
    ) {
      v = hmac(v, k);
      T = sjcl.bn.fromBits(sjcl.bitArray.concat(T.toBits(), v));
    }
    T = bits2int(T.toBits());
  }

  return T;
};

/**
* @param {bitArray} hash hash to sign.
* @param {Object} hashObject type of hash used for hmac
*   (default sjcl.hash.sha256)
* @param {sjcl.bn} q set the curve order
* @return {bitArray} signature
*/
sjcl.ecc.ecdsa.secretKey.prototype.signDeterministic =
function(hash, hashObject) {

  let k = this.generateK(hash, hashObject);
  return this.sign(hash, undefined, undefined, k);
};
