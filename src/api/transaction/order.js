/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;

const OfferCreateFlags = {
  passive: {set: 'Passive'},
  immediateOrCancel: {set: 'ImmediateOrCancel'},
  fillOrKill: {set: 'FillOrKill'}
};

function createOrderTransaction(account, order) {
  validate.address(account);
  validate.order(order);

  const transaction = new utils.common.core.Transaction();
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

function prepareOrder(account, order, instructions, callback) {
  const transaction = createOrderTransaction(account, order);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(prepareOrder);
