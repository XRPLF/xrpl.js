sjcl.ecc.ecdsa.secretKey.prototype.sign = function(hash, paranoia, k_for_testing) {
  var R = this._curve.r,
      l = R.bitLength();

  // k_for_testing should ONLY BE SPECIFIED FOR TESTING
  // specifying it will make the signature INSECURE
  var k;
  if (typeof k_for_testing === 'object' && k_for_testing.length > 0 && typeof k_for_testing[0] === 'number') {
    k = k_for_testing;
  } else if (typeof k_for_testing === 'string' && /^[0-9a-fA-F]+$/.test(k_for_testing)) {
    k = sjcl.bn.fromBits(sjcl.codec.hex.toBits(k_for_testing));        
  } else {
    // This is the only option that should be used in production
    k = sjcl.bn.random(R.sub(1), paranoia).add(1);
  }

  var r = this._curve.G.mult(k).x.mod(R);
  var s = sjcl.bn.fromBits(hash).add(r.mul(this._exponent)).mul(k.inverseMod(R)).mod(R);

  return sjcl.bitArray.concat(r.toBits(l), s.toBits(l));
};

sjcl.ecc.ecdsa.publicKey.prototype.verify = function(hash, rs) {
  var w = sjcl.bitArray,
      R = this._curve.r,
      l = R.bitLength(),
      r = sjcl.bn.fromBits(w.bitSlice(rs,0,l)),
      s = sjcl.bn.fromBits(w.bitSlice(rs,l,2*l)),
      sInv = s.inverseMod(R),
      hG = sjcl.bn.fromBits(hash).mul(sInv).mod(R),
      hA = r.mul(sInv).mod(R),
      r2 = this._curve.G.mult2(hG, hA, this._point).x;

  if (r.equals(0) || s.equals(0) || r.greaterEquals(R) || s.greaterEquals(R) || !r2.equals(r)) {
    throw (new sjcl.exception.corrupt("signature didn't check out"));
  }
  return true;
};
