'use strict';

const GlobalBigNumber = require('bignumber.js');

const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

function Value(value) {
  this._value = new BigNumber(value);
}

Value.prototype.abs = function() {
  let result = this._value.abs();
  return this._canonicalize(result);
};

Value.prototype.add = function(addend) {
  let result = this._value.plus(addend._value);
  return this._canonicalize(result);
};

Value.prototype.subtract = function(subtrahend) {
  let result = this._value.minus(subtrahend._value);
  return this._canonicalize(result);
};

Value.prototype.multiply = function(multiplicand) {
  let val = this._value;
  let mult = multiplicand._value;
  let result = (val).times(mult);
  return this._canonicalize(result);
};

Value.prototype.scale = function(scaleFactor) {
  let result = this._value.times(scaleFactor._value);
  return this._canonicalize(result);

};

Value.prototype.divide = function(divisor) {
  if (divisor === 0) {
    throw new Error('Divide by zero');
  }
  let result = this._value.dividedBy(divisor._value);
  return this._canonicalize(result);
};

Value.prototype.invert = function() {
  let result = (new BigNumber(this._value)).toPower(-1);
  return this._canonicalize(result);
};

exports.Value = Value;
