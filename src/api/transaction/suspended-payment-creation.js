/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const {validate, unixToRippleTimestamp, toRippledAmount} = utils.common;
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
    txJSON.CancelAfter = unixToRippleTimestamp(payment.allowCancelAfter);
  }
  if (payment.allowExecuteAfter !== undefined) {
    txJSON.FinishAfter = unixToRippleTimestamp(payment.allowExecuteAfter);
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

function prepareSuspendedPaymentCreation(account: string,
    payment: SuspendedPaymentCreation, instructions: Instructions = {}
): Promise<Prepare> {
  const txJSON = createSuspendedPaymentCreationTransaction(account, payment);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareSuspendedPaymentCreation;
