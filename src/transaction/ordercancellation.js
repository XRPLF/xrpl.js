/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
import type {Instructions, Prepare} from './types.js';

function createOrderCancellationTransaction(account: string,
    sequence: number
): Object {
  return {
    TransactionType: 'OfferCancel',
    Account: account,
    OfferSequence: sequence
  };
}

function prepareOrderCancellation(address: string, sequence: number,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareOrderCancellation({address, sequence, instructions});
  const txJSON = createOrderCancellationTransaction(address, sequence);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareOrderCancellation;
