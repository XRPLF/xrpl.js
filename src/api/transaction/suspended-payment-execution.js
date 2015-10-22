/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
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
): Object {
  validate.address(account);
  validate.suspendedPaymentExecution(payment);

  const txJSON: Object = {
    TransactionType: 'SuspendedPaymentFinish',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.paymentSequence
  };

  if (payment.method !== undefined) {
    txJSON.Method = payment.method;
  }
  if (payment.digest !== undefined) {
    txJSON.Digest = payment.digest;
  }
  if (payment.proof !== undefined) {
    txJSON.Proof = utils.convertStringToHex(payment.proof);
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo);
  }
  return txJSON;
}

function prepareSuspendedPaymentExecutionAsync(account: string,
    payment: SuspendedPaymentExecution, instructions: Instructions, callback
) {
  const txJSON = createSuspendedPaymentExecutionTransaction(account, payment);
  utils.prepareTransaction(txJSON, this, instructions, callback);
}

function prepareSuspendedPaymentExecution(account: string,
    payment: SuspendedPaymentExecution, instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareSuspendedPaymentExecutionAsync)
    .call(this, account, payment, instructions);
}

module.exports = prepareSuspendedPaymentExecution;
