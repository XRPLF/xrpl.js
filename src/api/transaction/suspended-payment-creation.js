/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const toRippledAmount = utils.common.toRippledAmount;
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
): Object {
  validate.address(account);
  validate.suspendedPaymentCreation(payment);

  const txJSON: Object = {
    TransactionType: 'SuspendedPaymentCreate',
    Account: account,
    Destination: payment.destination.address,
    Amount: toRippledAmount(payment.destination.amount)
  };

  if (payment.digest !== undefined) {
    txJSON.Digest = payment.digest;
  }
  if (payment.allowCancelAfter !== undefined) {
    txJSON.CancelAfter = utils.fromTimestamp(payment.allowCancelAfter);
  }
  if (payment.allowExecuteAfter !== undefined) {
    txJSON.FinishAfter = utils.fromTimestamp(payment.allowExecuteAfter);
  }
  if (payment.source.tag !== undefined) {
    txJSON.SourceTag = payment.source.tag;
  }
  if (payment.destination.tag !== undefined) {
    txJSON.DestinationTag = payment.destination.tag;
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo);
  }
  return txJSON;
}

function prepareSuspendedPaymentCreationAsync(account: string,
    payment: SuspendedPaymentCreation, instructions: Instructions, callback
) {
  const txJSON = createSuspendedPaymentCreationTransaction(account, payment);
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareSuspendedPaymentCreation(account: string,
    payment: SuspendedPaymentCreation, instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareSuspendedPaymentCreationAsync)
    .call(this, account, payment, instructions);
}

module.exports = prepareSuspendedPaymentCreation;
