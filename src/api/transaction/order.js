/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;
const xrpToDrops = utils.common.xrpToDrops;

function renameCounterpartyToIssuer(amount) {
  if (amount === undefined || amount.counterparty === undefined) {
    return amount;
  }
  const issuer = amount.counterparty === undefined ?
    amount.issuer : amount.counterparty;
  const withIssuer = _.assign({}, amount, {issuer: issuer});
  return _.omit(withIssuer, 'counterparty');
}

const OfferCreateFlags = {
  Passive: {name: 'passive', set: 'Passive'},
  ImmediateOrCancel: {name: 'immediateOrCancel', set: 'ImmediateOrCancel'},
  FillOrKill: {name: 'fillOrKill', set: 'FillOrKill'}
};

function toRippledAmount(amount) {
  return amount.currency === 'XRP' ?
    xrpToDrops(amount.value) : renameCounterpartyToIssuer(amount);
}

function createOrderTransaction(account, order) {
  validate.address(account);
  validate.order(order);

  const transaction = new ripple.Transaction();
  const takerPays = toRippledAmount(order.direction === 'buy' ?
    order.quantity : order.totalPrice);
  const takerGets = toRippledAmount(order.direction === 'buy' ?
    order.totalPrice : order.quantity);

  transaction.offerCreate(account, ripple.Amount.from_json(takerPays),
    ripple.Amount.from_json(takerGets));

  utils.setTransactionBitFlags(transaction, {
    input: order,
    flags: OfferCreateFlags
  });

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
