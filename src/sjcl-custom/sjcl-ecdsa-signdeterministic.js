'use strict';
var sjcl = require('sjcl');
/*global sjcl*/
/* eslint-disable new-cap: [2, {newIsCapExceptions: ["bn"]}] */

sjcl.ecc.ecdsa.secretKey.prototype.generateK =
function(hash, hashObject) {

  var curve = this._curve;

  var qlen = sjcl.bitArray.bitLength(curve.r.toBits());

  /* Utility functions */
  /* used to generate k and v */
  var repeat = function(str, times) {
    return (new Array(times + 1)).join(str);
  };
  var bits2int = function(bits) {

    var blen = sjcl.bitArray.bitLength(bits);

    if (blen > qlen) {
      return sjcl.bn.fromBits(sjcl.bitArray.bitSlice(bits, 0, qlen));
    } else if (qlen < blen) {
      return sjcl.bn.fromBits(sjcl.bitArray.concat(
        sjcl.codec.hex.toBits(repeat('0', Math.ceil((qlen - blen)/4))),
        q  
      ));
    } else {
      return sjcl.bn.fromBits(bits);
    }
  };
  var int2octets = function(integer) {
    var iModQ = integer.mulmod(new sjcl.bn(1), curve.r);

    var rlen = 8 * Math.ceil(qlen / 8);
    var ilen = sjcl.bitArray.bitLength(iModQ.toBits());

    return sjcl.bitArray.concat(
      sjcl.codec.hex.toBits(repeat('0', Math.ceil((rlen - ilen) / 4))),
      iModQ.toBits()
    );
  }
  var bits2octets = function(bits) {
    return int2octets(bits2int(bits).mulmod(new sjcl.bn(1), curve.r));
  }

  var hmac = function(bits, key) {
    var hmacK = new sjcl.misc.hmac(key, hashObject);
    return hmacK.encrypt(bits);
  };

  var hlen = sjcl.bitArray.bitLength(hash);
  var x = sjcl.bn.fromBits(this.get());

  var k = sjcl.codec.hex.toBits(repeat('00', Math.ceil(hlen/8)));
  var v = sjcl.codec.hex.toBits(repeat('01', Math.ceil(hlen/8)));

  k = hmac(
    sjcl.bitArray.concat(
      sjcl.bitArray.concat(v, sjcl.codec.hex.toBits("00")),
      sjcl.bitArray.concat(int2octets(x), bits2octets(hash))
    ),
    k
  );

  v = hmac(v, k);

  k = hmac(
    sjcl.bitArray.concat(
      sjcl.bitArray.concat(v, sjcl.codec.hex.toBits("01")),
      sjcl.bitArray.concat(int2octets(x), bits2octets(hash))
    ), 
    k
  );

  v = hmac(v, k);
  v = hmac(v, k);

  var T = sjcl.bn.fromBits(v);

  while (
    sjcl.bitArray.bitLength(T.toBits()) < qlen
  ) {
    v = hmac(v, k);
    T = sjcl.bn.fromBits(sjcl.bitArray.concat(T.toBits(), v));
  };
  T = bits2int(T.toBits());

  while (!(T.greaterEquals(1)) || (T.greaterEquals(curve.r))) {
    k = hmac(
      sjcl.bitArray.concat(v, sjcl.codec.hex.toBits("00")),
      k
    );

    v = hmac(v, k);
    T = sjcl.bn.fromBits(v);
    while (
      sjcl.bitArray.bitLength(T.toBits()) < qlen
    ) {
      v = hmac(v, k);
      T = sjcl.bn.fromBits(sjcl.bitArray.concat(T.toBits(), v));
    };
    T = bits2int(T.toBits());
  }

  return T;
}

/**
* @param {bitArray} hash hash to sign.
* @param {Object} hashObject type of hash used for hmac
*   (default sjcl.hash.sha256)
* @param {boolean} fakeLegacyVersion use old legacy version
* @return {bitArray} signature
*/
sjcl.ecc.ecdsa.secretKey.prototype.signDeterministic =
function(hash, hashObject) {

//  let k = this.generateK(hash, hashObject, q);
  let k = this.generateK(hash, hashObject);
  return this.sign(hash, undefined, undefined, k);
};

/* workaround to use the nist_p256 curve */
var neg3Doubl = sjcl.ecc.pointJac.prototype.doubl;
sjcl.ecc.pointJac.prototype.doubl = function () {
  if (!this.curve.a.equals(0)) {
    return neg3Doubl.call(this);
  };

  if (this.isIdentity) { return this; }

  var a = this.x.square();
  var b = this.y.square();
  var c = b.square();
  var d = this.x.add(b).square().subM(a).subM(c).doubleM();
  var e = a.mul(3);
  var f = e.square();
  var x = f.sub(d.copy().doubleM());
  var y = e.mul(d.sub(x)).subM(c.doubleM().doubleM().doubleM());
  var z = this.z.mul(this.y).doubleM();
  return new sjcl.ecc.pointJac(this.curve, x, y, z);
}

sjcl.ecc.curves.nist_p256 = sjcl.ecc.curves.c256;
sjcl.ecc.curves.c256 = sjcl.ecc.curves.k256;
