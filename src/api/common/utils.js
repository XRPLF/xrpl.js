'use strict';
const BigNumber = require('bignumber.js');

function dropsToXrp(drops) {
  return (new BigNumber(drops)).dividedBy(1000000.0).toString();
}

function xrpToDrops(xrp) {
  return (new BigNumber(xrp)).times(1000000.0).floor().toString();
}

function toRippledAmount(amount) {
  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value);
  }
  return {
    currency: amount.currency,
    issuer: amount.counterparty ? amount.counterparty : amount.issuer,
    value: amount.value
  };
}

function wrapCatch(asyncFunction: () => void): () => void {
  return function() {
    try {
      asyncFunction.apply(this, arguments);
    } catch (error) {
      const callback = arguments[arguments.length - 1];
      callback(error);
    }
  };
}

module.exports = {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  wrapCatch
};
