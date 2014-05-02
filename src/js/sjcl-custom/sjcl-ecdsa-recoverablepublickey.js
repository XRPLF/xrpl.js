/**
 *  This module uses the public key recovery method
 *  described in SEC 1: Elliptic Curve Cryptography,
 *  section 4.1.6, "Public Key Recovery Operation".
 *  http://www.secg.org/download/aid-780/sec1-v2.pdf
 *
 *  Implementation based on:
 *  https://github.com/bitcoinjs/bitcoinjs-lib/blob/89cf731ac7309b4f98994e3b4b67b7226020181f/src/ecdsa.js
 */

// Defined here so that this value only needs to be calculated once
var FIELD_MODULUS_PLUS_ONE_DIVIDED_BY_FOUR;

/**
 *  Sign the given hash such that the public key, prepending an extra byte 
 *  so that the public key will be recoverable from the signature
 *
 *  @param {bitArray} hash
 *  @param {Number} paranoia
 *  @returns {bitArray} Signature formatted as bitArray
 */
sjcl.ecc.ecdsa.secretKey.prototype.signWithRecoverablePublicKey = function(hash, paranoia, k_for_testing) {

  var self = this;

  // Convert hash to bits and determine encoding for output
  var hash_bits;
  if (typeof hash === 'object' && hash.length > 0 && typeof hash[0] === 'number') {
    hash_bits = hash;
  } else {
    throw new sjcl.exception.invalid('hash. Must be a bitArray');
  }

  // Sign hash with standard, canonicalized method
  var standard_signature = self.sign(hash_bits, paranoia, k_for_testing);
  var canonical_signature = self.canonicalizeSignature(standard_signature);

  // Extract r and s signature components from canonical signature
  var r_and_s = getRandSFromSignature(self._curve, canonical_signature);

  // Rederive public key
  var public_key = self._curve.G.mult(sjcl.bn.fromBits(self.get()));

  // Determine recovery factor based on which possible value
  // returns the correct public key
  var recovery_factor = calculateRecoveryFactor(self._curve, r_and_s.r, r_and_s.s, hash_bits, public_key);

  // Prepend recovery_factor to signature and encode in DER
  // The value_to_prepend should be 4 bytes total
  var value_to_prepend = recovery_factor + 27;

  var final_signature_bits = sjcl.bitArray.concat([value_to_prepend], canonical_signature);

  // Return value in bits
  return final_signature_bits;

};


/**
 *  Recover the public key from a signature created with the
 *  signWithRecoverablePublicKey method in this module
 *
 *  @static
 *
 *  @param {bitArray} hash
 *  @param {bitArray} signature
 *  @param {sjcl.ecc.curve} [sjcl.ecc.curves['c256']] curve
 *  @returns {sjcl.ecc.ecdsa.publicKey} Public key
 */
sjcl.ecc.ecdsa.publicKey.recoverFromSignature = function(hash, signature, curve) {

  if (!signature || signature instanceof sjcl.ecc.curve) {
    throw new sjcl.exception.invalid('must supply hash and signature to recover public key');
  }

  if (!curve) {
    curve = sjcl.ecc.curves['c256'];
  }

  // Convert hash to bits and determine encoding for output
  var hash_bits;
  if (typeof hash === 'object' && hash.length > 0 && typeof hash[0] === 'number') {
    hash_bits = hash;
  } else {
    throw new sjcl.exception.invalid('hash. Must be a bitArray');
  }

  var signature_bits;
  if (typeof signature === 'object' && signature.length > 0 && typeof signature[0] === 'number') {
    signature_bits = signature;
  } else {
    throw new sjcl.exception.invalid('signature. Must be a bitArray');
  }

  // Extract recovery_factor from first 4 bytes
  var recovery_factor = signature_bits[0] - 27;

  if (recovery_factor < 0 || recovery_factor > 3) {
    throw new sjcl.exception.invalid('signature. Signature must be generated with algorithm ' +
      'that prepends the recovery factor in order to recover the public key');
  }

  // Separate r and s values
  var r_and_s = getRandSFromSignature(curve, signature_bits.slice(1));
  var signature_r = r_and_s.r;
  var signature_s = r_and_s.s;

  // Recover public key using recovery_factor
  var recovered_public_key_point = recoverPublicKeyPointFromSignature(curve, signature_r, signature_s, hash_bits, recovery_factor);
  var recovered_public_key = new sjcl.ecc.ecdsa.publicKey(curve, recovered_public_key_point);

  return recovered_public_key;

};


/**
 *  Retrieve the r and s components of a signature  
 *
 *  @param {sjcl.ecc.curve} curve
 *  @param {bitArray} signature
 *  @returns {Object} Object with 'r' and 's' fields each as an sjcl.bn
 */
function getRandSFromSignature(curve, signature) {

  var r_length = curve.r.bitLength();

  return {
    r: sjcl.bn.fromBits(sjcl.bitArray.bitSlice(signature, 0, r_length)),
    s: sjcl.bn.fromBits(sjcl.bitArray.bitSlice(signature, r_length, sjcl.bitArray.bitLength(signature)))
  };
};


/**
 *  Determine the recovery factor by trying all four
 *  possibilities and figuring out which results in the
 *  correct public key
 *
 *  @param {sjcl.ecc.curve} curve
 *  @param {sjcl.bn} r
 *  @param {sjcl.bn} s
 *  @param {bitArray} hash_bits
 *  @param {sjcl.ecc.point} original_public_key_point
 *  @returns {Number, 0-3} Recovery factor
 */
function calculateRecoveryFactor(curve, r, s, hash_bits, original_public_key_point) {

  var original_public_key_point_bits = original_public_key_point.toBits();

  // TODO: verify that it is possible for the recovery_factor to be 2 or 3,
  // we may only need 1 bit because the canonical signature might remove the
  // possibility of us needing to "use the second candidate key"
  for (var possible_factor = 0; possible_factor < 4; possible_factor++) {

    var resulting_public_key_point;
    try {
      resulting_public_key_point = recoverPublicKeyPointFromSignature(curve, r, s, hash_bits, possible_factor);
    } catch (err) {
      // console.log(err, err.stack);
      continue;
    }

    if (sjcl.bitArray.equal(resulting_public_key_point.toBits(), original_public_key_point_bits)) {
      return possible_factor;
    }

  }

  throw new sjcl.exception.bug('unable to calculate recovery factor from signature');

};


/**
 *  Recover the public key from the signature.
 *
 *  @param {sjcl.ecc.curve} curve
 *  @param {sjcl.bn} r
 *  @param {sjcl.bn} s
 *  @param {bitArray} hash_bits
 *  @param {Number, 0-3} recovery_factor
 *  @returns {sjcl.point} Public key corresponding to signature
 */
function recoverPublicKeyPointFromSignature(curve, signature_r, signature_s, hash_bits, recovery_factor) {

  var field_order = curve.r;
  var field_modulus = curve.field.modulus;

  // Reduce the recovery_factor to the two bits used
  recovery_factor = recovery_factor & 3;

  // The less significant bit specifies whether the y coordinate
  // of the compressed point is even or not.
  var compressed_point_y_coord_is_even = recovery_factor & 1;

  // The more significant bit specifies whether we should use the
  // first or second candidate key.
  var use_second_candidate_key = recovery_factor >> 1;

  // Calculate (field_order + 1) / 4
  if (!FIELD_MODULUS_PLUS_ONE_DIVIDED_BY_FOUR) {
    FIELD_MODULUS_PLUS_ONE_DIVIDED_BY_FOUR = field_modulus.add(1).div(4);
  }

  // In the paper they write "1. For j from 0 to h do the following..."
  // That is not necessary here because we are given the recovery_factor
  // step 1.1 Let x = r + jn
  // Here "j" is either 0 or 1
  var x;
  if (use_second_candidate_key) {
    x = signature_r.add(field_order);
  } else {
    x = signature_r;
  }

  // step 1.2 and 1.3  convert x to an elliptic curve point
  // Following formula in section 2.3.4 Octet-String-to-Elliptic-Curve-Point Conversion
  var alpha = x.mul(x).mul(x).add(curve.a.mul(x)).add(curve.b).mod(field_modulus);
  var beta = alpha.powermodMontgomery(FIELD_MODULUS_PLUS_ONE_DIVIDED_BY_FOUR, field_modulus);

  // If beta is even but y isn't or
  // if beta is odd and y is even
  // then subtract beta from the field_modulus
  var y;
  var beta_is_even = beta.mod(2).equals(0);
  if (beta_is_even && !compressed_point_y_coord_is_even ||
    !beta_is_even && compressed_point_y_coord_is_even) {
    y = beta;
  } else {
    y = field_modulus.sub(beta);
  }

  // generated_point_R is the point generated from x and y
  var generated_point_R = new sjcl.ecc.point(curve, x, y);

  // step 1.4  check that R is valid and R x field_order !== infinity
  // TODO: add check for R x field_order === infinity
  if (!generated_point_R.isValidPoint()) {
    throw new sjcl.exception.corrupt('point R. Not a valid point on the curve. Cannot recover public key');
  }

  // step 1.5  Compute e from M
  var message_e = sjcl.bn.fromBits(hash_bits);
  var message_e_neg = new sjcl.bn(0).sub(message_e).mod(field_order);

  // step 1.6  Compute Q = r^-1 (sR - eG)
  // console.log('r: ', signature_r);
  var signature_r_inv = signature_r.inverseMod(field_order);
  var public_key_point = generated_point_R.mult2(signature_s, message_e_neg, curve.G).mult(signature_r_inv);

  // Validate public key point
  if (!public_key_point.isValidPoint()) {
    throw new sjcl.exception.corrupt('public_key_point. Not a valid point on the curve. Cannot recover public key');
  }

  // Verify that this public key matches the signature
  if (!verify_raw(curve, message_e, signature_r, signature_s, public_key_point)) {
    throw new sjcl.exception.corrupt('cannot recover public key');
  }

  return public_key_point;

};


/**
 *  Verify a signature given the raw components
 *  using method defined in section 4.1.5:
 *  "Alternative Verifying Operation"
 *
 *  @param {sjcl.ecc.curve} curve
 *  @param {sjcl.bn} e
 *  @param {sjcl.bn} r
 *  @param {sjcl.bn} s
 *  @param {sjcl.ecc.point} public_key_point
 *  @returns {Boolean} 
 */
function verify_raw(curve, e, r, s, public_key_point) {

  var field_order = curve.r;

  // Return false if r is out of bounds
  if ((new sjcl.bn(1)).greaterEquals(r) || r.greaterEquals(new sjcl.bn(field_order))) {
    return false;
  }

  // Return false if s is out of bounds
  if ((new sjcl.bn(1)).greaterEquals(s) || s.greaterEquals(new sjcl.bn(field_order))) {
    return false;
  }

  // Check that r = (u1 + u2)G
  // u1 = e x s^-1 (mod field_order)
  // u2 = r x s^-1 (mod field_order)
  var s_mod_inverse_field_order = s.inverseMod(field_order);
  var u1 = e.mul(s_mod_inverse_field_order).mod(field_order);
  var u2 = r.mul(s_mod_inverse_field_order).mod(field_order);

  var point_computed = curve.G.mult2(u1, u2, public_key_point);

  return r.equals(point_computed.x.mod(field_order));

};

