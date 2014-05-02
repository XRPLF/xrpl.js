/**
 *  Check that the point is valid based on the method described in
 *  SEC 1: Elliptic Curve Cryptography, section 3.2.2.1: 
 *  Elliptic Curve Public Key Validation Primitive
 *  http://www.secg.org/download/aid-780/sec1-v2.pdf
 *
 *  @returns {Boolean}
 */
sjcl.ecc.point.prototype.isValidPoint = function() {

  var self = this;

  var field_modulus = self.curve.field.modulus;

  if (self.isIdentity) {
    return false;
  }

  // Check that coordinatres are in bounds
  // Return false if x < 1 or x > (field_modulus - 1)
  if (((new sjcl.bn(1).greaterEquals(self.x)) &&
    !self.x.equals(1)) ||
    (self.x.greaterEquals(field_modulus.sub(1))) &&
    !self.x.equals(1)) {

    return false;
  }

  // Return false if y < 1 or y > (field_modulus - 1)
  if (((new sjcl.bn(1).greaterEquals(self.y)) &&
    !self.y.equals(1)) ||
    (self.y.greaterEquals(field_modulus.sub(1))) &&
    !self.y.equals(1)) {

    return false;
  }

  if (!self.isOnCurve()) {
    return false;
  }

  // TODO check to make sure point is a scalar multiple of base_point

  return true;

};

/**
 *  Check that the point is on the curve
 *
 *  @returns {Boolean}
 */
sjcl.ecc.point.prototype.isOnCurve = function() {

  var self = this;

  var field_order = self.curve.r;
  var component_a = self.curve.a;
  var component_b = self.curve.b;
  var field_modulus = self.curve.field.modulus;

  var left_hand_side = self.y.mul(self.y).mod(field_modulus);
  var right_hand_side = self.x.mul(self.x).mul(self.x).add(component_a.mul(self.x)).add(component_b).mod(field_modulus);

  return left_hand_side.equals(right_hand_side);

};


sjcl.ecc.point.prototype.toString = function() {
  return '(' + 
    this.x.toString() + ', ' +
    this.y.toString() +
    ')';
};

sjcl.ecc.pointJac.prototype.toString = function() {
  return '(' + 
    this.x.toString() + ', ' +
    this.y.toString() + ', ' +
    this.z.toString() +
    ')';
};
