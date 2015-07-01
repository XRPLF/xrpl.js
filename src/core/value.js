/* @flow */

'use strict';

const GlobalBigNumber = require('bignumber.js');

const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

class Value {

  constructor(value: string | BigNumber, base: number) {
    this._value = new BigNumber(value, base);
  }

  static getBNRoundDown() {
    return BigNumber.ROUND_DOWN;
  }

  abs() {
    const result = this._value.abs();
    return this._canonicalize(result);
  }

  add(addend: Value) {
    const result = this._value.plus(addend._value);
    return this._canonicalize(result);
  }

  subtract(subtrahend: Value) {
    const result = this._value.minus(subtrahend._value);
    return this._canonicalize(result);
  }

  multiply(multiplicand: Value) {
    const val = this._value;
    const mult = multiplicand._value;
    const result = (val).times(mult);
    return this._canonicalize(result);
  }

  scale(scaleFactor: Value) {
    const result = this._value.times(scaleFactor._value);
    return this._canonicalize(result);

  }

  divide(divisor: Value) {
    if (this._value.isNaN()) {
      throw new Error('Invalid dividend');
    }
    if (divisor.isNaN()) {
      throw new Error('Invalid divisor');
    }
    if (divisor.isZero()) {
      throw new Error('divide by zero');
    }
    const result = this._value.dividedBy(divisor._value);
    return this._canonicalize(result);
  }

  invert() {
    const result = (new BigNumber(this._value)).toPower(-1);
    return this._canonicalize(result);
  }

  isNaN() {
    return this._value.isNaN();
  }

  isZero() {
    return this._value.isZero();
  }

  isNegative() {
    return this._value.isNegative();
  }

  negated() {
    return this._value.neg();
  }

}

exports.Value = Value;
