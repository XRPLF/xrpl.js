'use strict';

const Value = require('./value').Value;
const GlobalBigNumber = require('bignumber.js');
const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

function Value_IOU(value) {
  Value.call(this, value);
}

Value_IOU.prototype = Object.create(Value.prototype);

Value_IOU.prototype.constructor = Value_IOU;

Value_IOU.fromXRPValue = function(XRPvalue, bi_xns_unit) {
  const newV = new Value_IOU(XRPvalue);
  newV._XRP = true;
  newV._bi_xns_unit = bi_xns_unit;
  return newV;
};

Value_IOU.prototype.multiply = function(multiplicand) {
  let mult = multiplicand;
  if (mult._XRP) {
    let constant = new BigNumber((mult._bi_xns_unit).toString());
    let value = new BigNumber(mult._value);
    mult._value = (value).times(constant);
  }
  return Value.prototype.multiply.call(this, mult);
};

Value_IOU.prototype.divide = function(divisor) {
  let div = divisor;
  if (div._XRP) {
    let constant = new BigNumber((div._bi_xns_unit).toString());
    let value = new BigNumber(div._value);
    div._value = (value).times(constant);
  }
  return Value.prototype.divide.call(this, div);
};

Value_IOU.prototype._canonicalize = function(value) {
  return new Value_IOU(value.toPrecision(16));
};

Value_IOU.prototype.equals = function(comparator) {
  return (comparator instanceof Value_IOU)
  && this._value.equals(comparator.value);
};

exports.Value_IOU = Value_IOU;
