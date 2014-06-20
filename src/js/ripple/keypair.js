var sjcl    = require('./utils').sjcl;

var UInt160 = require('./uint160').UInt160;
var UInt256 = require('./uint256').UInt256;
var Base    = require('./base').Base;

function KeyPair() {
  this._curve  = sjcl.ecc.curves.c256;
  this._secret = null;
  this._pubkey = null;
};

KeyPair.from_bn_secret = function(j) {
  return (j instanceof this) ? j.clone() : (new this()).parse_bn_secret(j);
};

KeyPair.prototype.parse_bn_secret = function(j) {
  this._secret = new sjcl.ecc.ecdsa.secretKey(sjcl.ecc.curves.c256, j);
  return this;
};

/**
 * Returns public key as sjcl public key.
 *
 * @private
 */
KeyPair.prototype._pub = function() {
  var curve = this._curve;

  if (!this._pubkey && this._secret) {
    var exponent = this._secret._exponent;
    this._pubkey = new sjcl.ecc.ecdsa.publicKey(curve, curve.G.mult(exponent));
  }

  return this._pubkey;
};

/**
 * Returns public key in compressed format as bit array.
 *
 * @private
 */
KeyPair.prototype._pub_bits = function() {
  var pub = this._pub();

  if (!pub) {
    return null;
  }

  var point = pub._point, y_even = point.y.mod(2).equals(0);

  return sjcl.bitArray.concat(
    [sjcl.bitArray.partial(8, y_even ? 0x02 : 0x03)],
    point.x.toBits(this._curve.r.bitLength())
  );
};

/**
 * Returns public key as hex.
 *
 * Key will be returned as a compressed pubkey - 33 bytes converted to hex.
 */
KeyPair.prototype.to_hex_pub = function() {
  var bits = this._pub_bits();

  if (!bits) {
    return null;
  }

  return sjcl.codec.hex.fromBits(bits).toUpperCase();
};

function SHA256_RIPEMD160(bits) {
  return sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
}

KeyPair.prototype.get_address = function() {
  var bits = this._pub_bits();

  if (!bits) {
    return null;
  }

  var hash = SHA256_RIPEMD160(bits);

  var address = UInt160.from_bits(hash);
  address.set_version(Base.VER_ACCOUNT_ID);
  return address;
};

KeyPair.prototype.sign = function(hash) {
  hash = UInt256.from_json(hash);
  var sig = this._secret.sign(hash.to_bits(), 0);
  sig = this._secret.canonicalizeSignature(sig);
  return this._secret.encodeDER(sig);
};

exports.KeyPair = KeyPair;
