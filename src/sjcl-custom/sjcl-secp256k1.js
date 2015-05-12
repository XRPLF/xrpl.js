/* eslint new-cap: [2, {newIsCapExceptions: ["pointJac"]}] */
'use strict';
let sjcl = require('sjcl');

// ----- for secp256k1 ------

sjcl.ecc.point.prototype.toBytesCompressed = function() {
  let header = this.y.mod(2).toString() === '0x0' ? 0x02 : 0x03;
  return [header].concat(sjcl.codec.bytes.fromBits(this.x.toBits()));
};

// Replace point addition and doubling algorithms
// NIST-P256 is a=-3, we need algorithms for a=0
//
// This is a custom point addition formula that
// only works for a=-3 Jacobian curve. It's much
// faster than the generic implementation
sjcl.ecc.pointJac.prototype.add = function(T) {
  let self = this;
  if (self.curve !== T.curve) {
    throw ('sjcl.ecc.add(): Points must be on the same curve to add them!');
  }

  if (self.isIdentity) {
    return T.toJac();
  } else if (T.isIdentity) {
    return self;
  }

  let z1z1 = self.z.square();
  let h = T.x.mul(z1z1).subM(self.x);
  let s2 = T.y.mul(self.z).mul(z1z1);

  if (h.equals(0)) {
    if (self.y.equals(T.y.mul(z1z1.mul(self.z)))) {
      // same point
      return self.doubl();
    }
    // inverses
    return new sjcl.ecc.pointJac(self.curve);
  }

  let hh = h.square();
  let i = hh.copy().doubleM().doubleM();
  let j = h.mul(i);
  let r = s2.sub(self.y).doubleM();
  let v = self.x.mul(i);

  let x = r.square().subM(j).subM(v.copy().doubleM());
  let y = r.mul(v.sub(x)).subM(self.y.mul(j).doubleM());
  let z = self.z.add(h).square().subM(z1z1).subM(hh);

  return new sjcl.ecc.pointJac(this.curve, x, y, z);
};

// This is a custom doubling algorithm that
// only works for a=-3 Jacobian curve. It's much
// faster than the generic implementation
let neg3Doubl = sjcl.ecc.pointJac.prototype.doubl;
sjcl.ecc.pointJac.prototype.doubl = function() {

  if (!this.curve.a.equals(0)) {
    return neg3Doubl.call(this);
  }

  if (this.isIdentity) {
    return this;
  }

  let a = this.x.square();
  let b = this.y.square();
  let c = b.square();
  let d = this.x.add(b).square().subM(a).subM(c).doubleM();
  let e = a.mul(3);
  let f = e.square();
  let x = f.sub(d.copy().doubleM());
  let y = e.mul(d.sub(x)).subM(c.doubleM().doubleM().doubleM());
  let z = this.z.mul(this.y).doubleM();
  return new sjcl.ecc.pointJac(this.curve, x, y, z);
};

// DEPRECATED:
// previously the c256 curve was overridden with the secp256k1 curve
// since then, sjcl has been updated to support k256
// this override exist to keep supporting the old c256 with k256 behavior
// this will be removed in future release
sjcl.ecc.curves.nist_p256 = sjcl.ecc.curves.c256;
sjcl.ecc.curves.c256 = sjcl.ecc.curves.k256;
