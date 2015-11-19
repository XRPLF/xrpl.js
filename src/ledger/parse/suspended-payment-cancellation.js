/* @flow */
'use strict';
const assert = require('assert');
const utils = require('./utils');

function parseSuspendedPaymentCancellation(tx: Object): Object {
  assert(tx.TransactionType === 'SuspendedPaymentCancel');

  return utils.removeUndefined({
    memos: utils.parseMemos(tx),
    owner: tx.Owner,
    suspensionSequence: tx.OfferSequence
  });
}

module.exports = parseSuspendedPaymentCancellation;
