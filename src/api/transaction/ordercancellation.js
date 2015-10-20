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

function prepareOrderCancellationAsync(account: string, sequence: number,
  instructions: Instructions, callback
) {
  const txJSON = createOrderCancellationTransaction(account, sequence);
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareOrderCancellation(account: string, sequence: number,
    instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareOrderCancellationAsync.bind(this))(
    account, sequence, instructions);
}

module.exports = prepareOrderCancellation;
