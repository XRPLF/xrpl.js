/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const toRippledAmount = utils.common.toRippledAmount;
const Transaction = utils.common.core.Transaction;
import type {Instructions, Prepare} from './types.js';
import type {Adjustment, MaxAdjustment, Memo} from '../common/types.js';

type SuspendedPaymentCreation = {
  source: MaxAdjustment,
  destination: Adjustment,
  memos?: Array<Memo>,
  digest?: string,
  allowCancelAfter?: number,
  allowExecuteAfter?: number
}

function createSuspendedPaymentCreationTransaction(account: string,
    payment: SuspendedPaymentCreation
): Transaction {
  validate.address(account);
  validate.suspendedPaymentCreation(payment);

  const transaction = new Transaction();
  transaction.suspendedPaymentCreate({
    account: account,
    destination: payment.destination.address,
    amount: toRippledAmount(payment.destination.amount)
  });

  if (payment.digest) {
    transaction.setDigest(payment.digest);
  }
  if (payment.allowCancelAfter) {
    transaction.setAllowCancelAfter(payment.allowCancelAfter);
  }
  if (payment.allowExecuteAfter) {
    transaction.setAllowExecuteAfter(payment.allowExecuteAfter);
  }

  if (payment.source.tag) {
    transaction.sourceTag(payment.source.tag);
  }
  if (payment.destination.tag) {
    transaction.destinationTag(payment.destination.tag);
  }
  if (payment.memos) {
    _.forEach(payment.memos, memo =>
      transaction.addMemo(memo.type, memo.format, memo.data)
    );
  }
  return transaction;
}

function prepareSuspendedPaymentCreationAsync(account: string,
    payment: SuspendedPaymentCreation, instructions: Instructions, callback
) {
  const txJSON =
    createSuspendedPaymentCreationTransaction(account, payment).tx_json;
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareSuspendedPaymentCreation(account: string,
    payment: SuspendedPaymentCreation, instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareSuspendedPaymentCreationAsync)
    .call(this, account, payment, instructions);
}

module.exports = prepareSuspendedPaymentCreation;
