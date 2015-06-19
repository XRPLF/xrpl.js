/* @flow */
'use strict';
const assert = require('assert');
const utils = require('./utils');
const parseAmount = require('./amount');
const Transaction = utils.core.Transaction;

function isPartialPayment(tx) {
  return (tx.Flags & Transaction.flags.Payment.PartialPayment) !== 0;
}

function isNoDirectRipple(tx) {
  return (tx.Flags & Transaction.flags.Payment.NoRippleDirect) !== 0;
}

function parsePaymentMemos(tx) {
  if (!Array.isArray(tx.Memos) || tx.Memos.length === 0) {
    return undefined;
  }
  return tx.Memos.map((m) => m.Memo);
}

function parsePayment(tx: Object): Object {
  assert(tx.TransactionType === 'Payment');

  const source = {
    address: tx.Account,
    amount: parseAmount(tx.SendMax || tx.Amount),
    tag: tx.SourceTag
  };

  const destination = {
    address: tx.Destination,
    amount: parseAmount(tx.Amount),
    tag: tx.DestinationTag
  };

  return {
    source: utils.removeUndefined(source),
    destination: utils.removeUndefined(destination),
    memos: parsePaymentMemos(tx),
    invoiceID: tx.InvoiceID,
    paths: JSON.stringify(tx.Paths || []),
    allowPartialPayment: isPartialPayment(tx),
    noDirectRipple: isNoDirectRipple(tx)
  };
}

module.exports = parsePayment;
