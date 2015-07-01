'use strict';
const BigNumber = require('bignumber.js');
const core = require('../../core');

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

function composeAsync(wrapper, callback) {
  return function(error, data) {
    if (error) {
      callback(error);
      return;
    }
    let result;
    try {
      result = wrapper(data);
    } catch (exception) {
      callback(exception);
      return;
    }
    callback(null, result);
  };
}

module.exports = {
  core,
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  wrapCatch,
  composeAsync
};
