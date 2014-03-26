sjcl.ecc.ecdsa.secretKey.prototype.canonicalizeSignature = function(rs) {
  var w = sjcl.bitArray,
      R = this._curve.r,
      l = R.bitLength();

  var r = sjcl.bn.fromBits(w.bitSlice(rs,0,l)),
      s = sjcl.bn.fromBits(w.bitSlice(rs,l,2*l));

  // For a canonical signature we want the lower of two possible values for s
  // 0 < s <= n/2
  if (!R.copy().halveM().greaterEquals(s)) {
    s = R.sub(s);
  }

  return w.concat(r.toBits(l), s.toBits(l));
};

