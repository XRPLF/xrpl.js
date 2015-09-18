/* @flow */
'use strict';
const assert = require('assert');
const utils = require('./utils');
const parsePayment = require('./payment');
const parseTrustline = require('./trustline');
const parseOrder = require('./order');
const parseOrderCancellation = require('./cancellation');
const parseSettings = require('./settings');
const parseSuspendedPaymentCreation = require('./suspended-payment-creation');
const parseSuspendedPaymentExecution = require('./suspended-payment-execution');
const parseSuspendedPaymentCancellation =
  require('./suspended-payment-cancellation');

function parseTransactionType(type) {
  const mapping = {
    Payment: 'payment',
    TrustSet: 'trustline',
    OfferCreate: 'order',
    OfferCancel: 'orderCancellation',
    AccountSet: 'settings',
    SetRegularKey: 'settings',
    SuspendedPaymentCreate: 'suspendedPaymentCreation',
    SuspendedPaymentFinish: 'suspendedPaymentExecution',
    SuspendedPaymentCancel: 'suspendedPaymentCancellation'
  };
  return mapping[type] || null;
}

function parseTransaction(tx: Object): Object {
  const type = parseTransactionType(tx.TransactionType);
  const mapping = {
    'payment': parsePayment,
    'trustline': parseTrustline,
    'order': parseOrder,
    'orderCancellation': parseOrderCancellation,
    'settings': parseSettings,
    'suspendedPaymentCreation': parseSuspendedPaymentCreation,
    'suspendedPaymentExecution': parseSuspendedPaymentExecution,
    'suspendedPaymentCancellation': parseSuspendedPaymentCancellation
  };
  const parser = mapping[type];
  assert(parser !== undefined, 'Unrecognized transaction type');
  const specification = parser(tx);
  const outcome = utils.parseOutcome(tx);
  return utils.removeUndefined({
    type: type,
    address: tx.Account,
    sequence: tx.Sequence,
    id: tx.hash,
    specification: utils.removeUndefined(specification),
    outcome: outcome ? utils.removeUndefined(outcome) : undefined
  });
}

module.exports = parseTransaction;
