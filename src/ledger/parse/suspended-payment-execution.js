/* @flow */
'use strict';
const assert = require('assert');
const utils = require('./utils');

function parseSuspendedPaymentExecution(tx: Object): Object {
  assert(tx.TransactionType === 'SuspendedPaymentFinish');

  return utils.removeUndefined({
    memos: utils.parseMemos(tx),
    owner: tx.Owner,
    paymentSequence: tx.OfferSequence,
    method: tx.Method,
    digest: tx.Digest,
    proof: tx.Proof ? utils.hexToString(tx.Proof) : undefined
  });
}

module.exports = parseSuspendedPaymentExecution;
