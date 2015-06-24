'use strict';

const GlobalBigNumber = require('bignumber.js');
const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

const Value = require('./value').Value;

function Value_XRP(value, bi_xns_unit) {
  Value.call(this, value);
  this._bi_xns_unit = bi_xns_unit;
  this._XRP = true;
}

Value_XRP.prototype = Object.create(Value.prototype);

Value_XRP.prototype.constructor = Value_XRP;

Value_XRP.prototype._canonicalize = function(value) {
  return new Value_XRP(value.round(6, BigNumber.ROUND_DOWN));
};

Value_XRP.prototype.equals = function(comparator) {
  return (comparator instanceof Value_XRP)
  && this._value.equals(comparator.value);
};

exports.Value_XRP = Value_XRP;
