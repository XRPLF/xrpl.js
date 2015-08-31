/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;

function createSuspendedPaymentExecutionTransaction(account, payment) {
  validate.address(account);
  validate.suspendedPaymentExecution(payment);

  const transaction = new Transaction();
  transaction.suspendedPaymentFinish({
    account: account,
    owner: payment.owner,
    paymentSequence: payment.paymentSequence
  });

  if (payment.method) {
    transaction.setMethod(payment.method);
  }
  if (payment.digest) {
    transaction.setDigest(payment.digest);
  }
  if (payment.proof) {
    transaction.setProof(payment.proof);
  }

  if (payment.memos) {
    _.forEach(payment.memos, memo =>
      transaction.addMemo(memo.type, memo.format, memo.data)
    );
  }
  return transaction;
}

function prepareSuspendedPaymentExecutionAsync(account, payment, instructions,
callback) {
  const transaction =
    createSuspendedPaymentExecutionTransaction(account, payment);
  utils.prepareTransaction(transaction, this.remote, instructions, callback);
}

function prepareSuspendedPaymentExecution(account: string, payment: Object,
instructions = {}) {
  return utils.promisify(prepareSuspendedPaymentExecutionAsync)
    .call(this, account, payment, instructions);
}

module.exports = prepareSuspendedPaymentExecution;
