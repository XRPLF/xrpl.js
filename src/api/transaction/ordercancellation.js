/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
import type {Instructions, Prepare} from './types.js';

function createOrderCancellationTransaction(account: string,
    sequence: number
): Object {
  validate.address(account);
  validate.sequence(sequence);

  return {
    TransactionType: 'OfferCancel',
    Account: account,
    OfferSequence: sequence
  };
}

function prepareOrderCancellation(account: string, sequence: number,
  instructions: Instructions = {}
): Promise<Prepare> {
  const txJSON = createOrderCancellationTransaction(account, sequence);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareOrderCancellation;
