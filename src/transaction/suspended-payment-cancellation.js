/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
import type {Instructions, Prepare} from './types.js';
import type {Memo} from '../common/types.js';

type SuspendedPaymentCancellation = {
  owner: string,
  paymentSequence: number,
  memos?: Array<Memo>
}

function createSuspendedPaymentCancellationTransaction(account: string,
  payment: SuspendedPaymentCancellation
): Object {
  const txJSON: Object = {
    TransactionType: 'SuspendedPaymentCancel',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.paymentSequence
  };
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo);
  }
  return txJSON;
}

function prepareSuspendedPaymentCancellation(address: string,
  suspendedPaymentCancellation: SuspendedPaymentCancellation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareSuspendedPaymentCancellation(
    {address, suspendedPaymentCancellation, instructions});
  const txJSON = createSuspendedPaymentCancellationTransaction(
    address, suspendedPaymentCancellation);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareSuspendedPaymentCancellation;
