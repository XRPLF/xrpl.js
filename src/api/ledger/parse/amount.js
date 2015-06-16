'use strict';
const utils = require('./utils');

function parseAmount(amount) {
  if (typeof amount === 'string') {
    return {
      currency: 'XRP',
      value: utils.dropsToXrp(amount)
    };
  }
  return {
    currency: amount.currency,
    value: amount.value,
    counterparty: amount.issuer || amount.counterparty
  };
}

module.exports = parseAmount;
