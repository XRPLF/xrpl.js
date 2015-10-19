/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;
import type {Instructions, Prepare} from './types.js';

function createOrderCancellationTransaction(account: string,
    sequence: number
): Transaction {
  validate.address(account);
  validate.sequence(sequence);

  const transaction = new Transaction();
  transaction.offerCancel(account, sequence);
  return transaction;
}

function prepareOrderCancellationAsync(account: string, sequence: number,
  instructions: Instructions, callback
) {
  const txJSON = createOrderCancellationTransaction(account, sequence).tx_json;
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareOrderCancellation(account: string, sequence: number,
    instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareOrderCancellationAsync.bind(this))(
    account, sequence, instructions);
}

module.exports = prepareOrderCancellation;
