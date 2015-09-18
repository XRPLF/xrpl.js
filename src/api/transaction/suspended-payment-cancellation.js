/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;

function createSuspendedPaymentCancellationTransaction(account, payment) {
  validate.address(account);
  validate.suspendedPaymentCancellation(payment);

  const transaction = new Transaction();
  transaction.suspendedPaymentCancel({
    account: account,
    owner: payment.owner,
    paymentSequence: payment.paymentSequence
  });

  if (payment.memos) {
    _.forEach(payment.memos, memo =>
      transaction.addMemo(memo.type, memo.format, memo.data)
    );
  }
  return transaction;
}

function prepareSuspendedPaymentCancellationAsync(account, payment,
instructions, callback) {
  const transaction =
    createSuspendedPaymentCancellationTransaction(account, payment);
  utils.prepareTransaction(transaction, this.remote, instructions, callback);
}

function prepareSuspendedPaymentCancellation(account: string, payment: Object,
instructions = {}) {
  return utils.promisify(prepareSuspendedPaymentCancellationAsync)
    .call(this, account, payment, instructions);
}

module.exports = prepareSuspendedPaymentCancellation;
