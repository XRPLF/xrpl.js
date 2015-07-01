/* @flow */

'use strict';

const Value = require('./value').Value;
const GlobalBigNumber = require('bignumber.js');
const BigNumber = GlobalBigNumber.another({
  ROUNDING_MODE: GlobalBigNumber.ROUND_HALF_UP,
  DECIMAL_PLACES: 40
});

class IOUValue extends Value {

  constructor(value: string | BigNumber) {
    super(value);
  }

  multiplyByXRP(multiplicand: {_value: BigNumber, _bi_xns_unit: number}) {
    const constant = new BigNumber((multiplicand._bi_xns_unit).toString());
    const value = new BigNumber(multiplicand._value);
    multiplicand._value = (value).times(constant);
    return super.multiply(multiplicand);
  }

  divideByXRP(divisor: {_value: BigNumber, _bi_xns_unit: number}) {
    const constant = new BigNumber((divisor._bi_xns_unit).toString());
    const value = new BigNumber(divisor._value);
    divisor._value = (value).times(constant);
    return super.divide(divisor);
  }

  _canonicalize(value) {
    return new IOUValue(value.toPrecision(16));
  }

  equals(comparator) {
    return (comparator instanceof IOUValue)
    && this._value.equals(comparator.value);
  }

}

exports.IOUValue = IOUValue;
