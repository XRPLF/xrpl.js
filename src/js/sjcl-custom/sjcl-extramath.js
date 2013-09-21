sjcl.bn.ZERO = new sjcl.bn(0);

/** [ this / that , this % that ] */
sjcl.bn.prototype.divRem = function (that) {
  if (typeof(that) !== "object") { that = new this._class(that); }
  var thisa = this.abs(), thata = that.abs(), quot = new this._class(0),
      ci = 0;
  if (!thisa.greaterEquals(thata)) {
    return [new sjcl.bn(0), this.copy()];
  } else if (thisa.equals(thata)) {
    return [new sjcl.bn(1), new sjcl.bn(0)];
  }

  for (; thisa.greaterEquals(thata); ci++) {
    thata.doubleM();
  }
  for (; ci > 0; ci--) {
    quot.doubleM();
    thata.halveM();
    if (thisa.greaterEquals(thata)) {
      quot.addM(1);
      thisa.subM(that).normalize();
    }
  }
  return [quot, thisa];
};

/** this /= that (rounded to nearest int) */
sjcl.bn.prototype.divRound = function (that) {
  var dr = this.divRem(that), quot = dr[0], rem = dr[1];

  if (rem.doubleM().greaterEquals(that)) {
    quot.addM(1);
  }

  return quot;
};

/** this /= that (rounded down) */
sjcl.bn.prototype.div = function (that) {
  var dr = this.divRem(that);
  return dr[0];
};

sjcl.bn.prototype.sign = function () {
  return this.greaterEquals(sjcl.bn.ZERO) ? 1 : -1;
};

/** -this */
sjcl.bn.prototype.neg = function () {
  return sjcl.bn.ZERO.sub(this);
};

/** |this| */
sjcl.bn.prototype.abs = function () {
  if (this.sign() === -1) {
    return this.neg();
  } else return this;
};

/** this >> that */
sjcl.bn.prototype.shiftRight = function (that) {
  if ("number" !== typeof that) {
    throw new Error("shiftRight expects a number");
  }

  that = +that;

  if (that < 0) {
    return this.shiftLeft(that);
  }

  var a = new sjcl.bn(this);

  while (that >= this.radix) {
    a.limbs.shift();
    that -= this.radix;
  }

  while (that--) {
    a.halveM();
  }

  return a;
};

/** this >> that */
sjcl.bn.prototype.shiftLeft = function (that) {
  if ("number" !== typeof that) {
    throw new Error("shiftLeft expects a number");
  }

  that = +that;

  if (that < 0) {
    return this.shiftRight(that);
  }

  var a = new sjcl.bn(this);

  while (that >= this.radix) {
    a.limbs.unshift(0);
    that -= this.radix;
  }

  while (that--) {
    a.doubleM();
  }

  return a;
};

/** (int)this */
// NOTE Truncates to 32-bit integer
sjcl.bn.prototype.toNumber = function () {
  return this.limbs[0] | 0;
};

/** find n-th bit, 0 = LSB */
sjcl.bn.prototype.testBit = function (bitIndex) {
  var limbIndex = Math.floor(bitIndex / this.radix);
  var bitIndexInLimb = bitIndex % this.radix;

  if (limbIndex >= this.limbs.length) return 0;

  return (this.limbs[limbIndex] >>> bitIndexInLimb) & 1;
};

/** set n-th bit, 0 = LSB */
sjcl.bn.prototype.setBitM = function (bitIndex) {
  var limbIndex = Math.floor(bitIndex / this.radix);
  var bitIndexInLimb = bitIndex % this.radix;

  while (limbIndex >= this.limbs.length) this.limbs.push(0);

  this.limbs[limbIndex] |= 1 << bitIndexInLimb;

  this.cnormalize();

  return this;
};

sjcl.bn.prototype.modInt = function (n) {
  return this.toNumber() % n;
};
