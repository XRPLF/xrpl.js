// ----- for secp256k1 ------

sjcl.ecc.point.prototype.toBytesCompressed = function () {
  var header = this.y.mod(2).toString() == "0x0" ? 0x02 : 0x03;
  return [header].concat(sjcl.codec.bytes.fromBits(this.x.toBits()))
};

// DEPRECATED:
// previously the c256 curve was overridden with the secp256k1 curve
// since then, sjcl has been update to support k256
// this override exist to keep supporting the old c256 with k256 behavior
// this will be removed in future release
sjcl.ecc.curves.c256 = sjcl.ecc.curves.k256;