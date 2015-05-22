'use strict';
const BigNumber = require('bignumber.js');

function dropsToXrp(drops) {
  return (new BigNumber(drops)).dividedBy(1000000.0).toString();
}

function xrpToDrops(xrp) {
  return (new BigNumber(xrp)).times(1000000.0).floor().toString();
}

function convertAmount(amount) {
  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value);
  }
  return {
    currency: amount.currency,
    issuer: amount.counterparty ? amount.counterparty : amount.issuer,
    value: amount.value
  };
}

module.exports = {
  dropsToXrp: dropsToXrp,
  xrpToDrops: xrpToDrops,
  convertAmount: convertAmount
};
