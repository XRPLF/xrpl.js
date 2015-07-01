'use strict';

const GlobalBigNumber = require('bignumber.js');
const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

const Value = require('./value').Value;

class XRPValue extends Value {

  constructor(value, bi_xns_unit) {
    super(value);
    this._bi_xns_unit = bi_xns_unit;
  }

  _canonicalize(value) {
    return new XRPValue(value.round(6, BigNumber.ROUND_DOWN));
  }

  equals(comparator) {
    return (comparator instanceof XRPValue)
    && this._value.equals(comparator.value);
  }

}

exports.XRPValue = XRPValue;
