/* @flow */

'use strict';

const GlobalBigNumber = require('bignumber.js');

const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

const assert = require('assert');

class Value {

  constructor(value: string | BigNumber) {
    if (this.constructor === 'Value') {
      throw new Error(
        'Cannot instantiate Value directly, it is an abstract base class');
    }
    this._value = new BigNumber(value);
  }

  static getBNRoundDown() {
    return BigNumber.ROUND_DOWN;
  }

  abs() {
    const result = this._value.abs();
    return this._canonicalize(result);
  }

  add(addend: Value) {
    assert(this.constructor === addend.constructor);
    const result = this._value.plus(addend._value);
    return this._canonicalize(result);
  }

  subtract(subtrahend: Value) {
    assert(this.constructor === subtrahend.constructor);
    const result = this._value.minus(subtrahend._value);
    return this._canonicalize(result);
  }

  multiply(multiplicand: Value) {
    const result = this._value.times(multiplicand._value);
    return this._canonicalize(result);
  }

  divide(divisor: Value) {
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

  round(decimalPlaces: number, roundingMode: number) {
    const result = this._value.round(decimalPlaces, roundingMode);
    return this._canonicalize(result);
  }

  toFixed(decimalPlaces: number, roundingMode: number) {
    return this._value.toFixed(decimalPlaces, roundingMode);
  }

  getExponent() {
    return this._value.e;
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

  toString() {
    return this._value.toString();
  }

  greaterThan(comparator: Value) {
    assert(this.constructor === comparator.constructor);
    return this._value.greaterThan(comparator._value);
  }

  lessThan(comparator: Value) {
    assert(this.constructor === comparator.constructor);
    return this._value.lessThan(comparator._value);
  }

  comparedTo(comparator: Value) {
    assert(this.constructor === comparator.constructor);
    return this._value.comparedTo(comparator._value);
  }

}

exports.Value = Value;
