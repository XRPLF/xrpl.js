/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;

function createOrderCancellationTransaction(account, sequence) {
  validate.address(account);
  validate.sequence(sequence);

  const transaction = new Transaction();
  transaction.offerCancel(account, sequence);
  return transaction;
}

function prepareOrderCancellationAsync(account, sequence, instructions,
  callback
) {
  const transaction = createOrderCancellationTransaction(account, sequence);
  utils.prepareTransaction(transaction, this.remote, instructions, callback);
}

function prepareOrderCancellation(account: string, sequence: number,
    instructions = {}
) {
  return utils.promisify(prepareOrderCancellationAsync.bind(this))(
    account, sequence, instructions);
}

module.exports = prepareOrderCancellation;
