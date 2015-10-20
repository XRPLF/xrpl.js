/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;
import type {Instructions, Prepare} from './types.js';
import type {Order} from '../ledger/transaction-types.js';

const OfferCreateFlags = {
  passive: {set: 'Passive'},
  immediateOrCancel: {set: 'ImmediateOrCancel'},
  fillOrKill: {set: 'FillOrKill'}
};

function createOrderTransaction(account: string, order: Order): Transaction {
  validate.address(account);
  validate.order(order);

  const transaction = new Transaction();
  const takerPays = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.quantity : order.totalPrice);
  const takerGets = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.totalPrice : order.quantity);

  transaction.offerCreate(account, takerPays, takerGets);

  utils.setTransactionBitFlags(transaction, order, OfferCreateFlags);
  if (order.direction === 'sell') {
    transaction.setFlags('Sell');
  }

  return transaction;
}

function prepareOrderAsync(account: string, order: Order,
    instructions: Instructions, callback
) {
  const txJSON = createOrderTransaction(account, order).tx_json;
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareOrder(account: string, order: Order,
    instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareOrderAsync.bind(this))(
    account, order, instructions);
}

module.exports = prepareOrder;
