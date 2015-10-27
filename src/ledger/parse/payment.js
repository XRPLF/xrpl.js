/* @flow */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const parseAmount = require('./amount');
const txFlags = utils.txFlags;

function isPartialPayment(tx) {
  return (tx.Flags & txFlags.Payment.PartialPayment) !== 0;
}

function isNoDirectRipple(tx) {
  return (tx.Flags & txFlags.Payment.NoRippleDirect) !== 0;
}

function isQualityLimited(tx) {
  return (tx.Flags & txFlags.Payment.LimitQuality) !== 0;
}

function removeGenericCounterparty(amount, address) {
  return amount.counterparty === address ?
    _.omit(amount, 'counterparty') : amount;
}

function parsePayment(tx: Object): Object {
  assert(tx.TransactionType === 'Payment');

  const source = {
    address: tx.Account,
    maxAmount: removeGenericCounterparty(
      parseAmount(tx.SendMax || tx.Amount), tx.Account),
    tag: tx.SourceTag
  };

  const destination = {
    address: tx.Destination,
    amount: removeGenericCounterparty(parseAmount(tx.Amount), tx.Destination),
    tag: tx.DestinationTag
  };

  return utils.removeUndefined({
    source: utils.removeUndefined(source),
    destination: utils.removeUndefined(destination),
    memos: utils.parseMemos(tx),
    invoiceID: tx.InvoiceID,
    paths: tx.Paths ? JSON.stringify(tx.Paths) : undefined,
    allowPartialPayment: isPartialPayment(tx) || undefined,
    noDirectRipple: isNoDirectRipple(tx) || undefined,
    limitQuality: isQualityLimited(tx) || undefined
  });
}

module.exports = parsePayment;
