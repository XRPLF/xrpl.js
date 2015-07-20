/* @flow */
'use strict';
const utils = require('./utils');

type Amount = string | {currency: string, issuer: string, value: string}
type XRPAmount = {currency: string, value: string}
type IOUAmount = {currency: string, value: string, counterparty: string}
type Output = XRPAmount | IOUAmount

function parseAmount(amount: Amount): Output {
  if (typeof amount === 'string') {
    return {
      currency: 'XRP',
      value: utils.dropsToXrp(amount)
    };
  }
  return {
    currency: amount.currency,
    value: amount.value,
    counterparty: amount.issuer
  };
}

module.exports = parseAmount;
