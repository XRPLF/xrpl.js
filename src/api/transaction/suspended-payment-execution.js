/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;
import type {Instructions, Prepare} from './types.js';
import type {Memo} from '../common/types.js';

type SuspendedPaymentExecution = {
  owner: string,
  paymentSequence: number,
  memos?: Array<Memo>,
  method?: number,
  digest?: string,
  proof?: string
}

function createSuspendedPaymentExecutionTransaction(account: string,
      payment: SuspendedPaymentExecution
): Transaction {
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

function prepareSuspendedPaymentExecutionAsync(account: string,
    payment: SuspendedPaymentExecution, instructions: Instructions, callback
) {
  const txJSON =
    createSuspendedPaymentExecutionTransaction(account, payment).tx_json;
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareSuspendedPaymentExecution(account: string,
    payment: SuspendedPaymentExecution, instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareSuspendedPaymentExecutionAsync)
    .call(this, account, payment, instructions);
}

module.exports = prepareSuspendedPaymentExecution;
