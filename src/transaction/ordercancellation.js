/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
import type {Instructions, Prepare} from './types.js';

function createOrderCancellationTransaction(account: string,
    orderCancellation: Object
): Object {
  return {
    TransactionType: 'OfferCancel',
    Account: account,
    OfferSequence: orderCancellation.orderSequence
  };
}

function prepareOrderCancellation(address: string, orderCancellation: Object,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareOrderCancellation({address, orderCancellation, instructions});
  const txJSON = createOrderCancellationTransaction(address, orderCancellation);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareOrderCancellation;
