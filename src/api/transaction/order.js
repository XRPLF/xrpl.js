'use strict';
const _ = require('lodash');
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

function renameCounterpartyToIssuer(amount) {
  if (amount === undefined) {
    return undefined;
  }
  const issuer = amount.counterparty === undefined ?
    amount.issuer : amount.counterparty;
  const withIssuer = _.assign({}, amount, {issuer: issuer});
  return _.omit(withIssuer, 'counterparty');
}

function renameCounterpartyToIssuerInOrder(order) {
  const taker_gets = renameCounterpartyToIssuer(order.taker_gets);
  const taker_pays = renameCounterpartyToIssuer(order.taker_pays);
  const changes = {taker_gets: taker_gets, taker_pays: taker_pays};
  return _.assign({}, order, _.omit(changes, _.isUndefined));
}

const OfferCreateFlags = {
  Passive: {name: 'passive', set: 'Passive'},
  ImmediateOrCancel: {name: 'immediate_or_cancel', set: 'ImmediateOrCancel'},
  FillOrKill: {name: 'fill_or_kill', set: 'FillOrKill'}
};

function createOrderTransaction(account, order) {
  validate.address(account);
  validate.order(order);

  const _order = renameCounterpartyToIssuerInOrder(order);
  const transaction = new ripple.Transaction();
  const takerPays = _order.taker_pays.currency !== 'XRP'
    ? _order.taker_pays : utils.xrpToDrops(_order.taker_pays.value);
  const takerGets = _order.taker_gets.currency !== 'XRP'
    ? _order.taker_gets : utils.xrpToDrops(_order.taker_gets.value);

  transaction.offerCreate(account, ripple.Amount.from_json(takerPays),
    ripple.Amount.from_json(takerGets));

  utils.setTransactionBitFlags(transaction, {
    input: _order,
    flags: OfferCreateFlags
  });

  if (_order.type === 'sell') {
    transaction.setFlags('Sell');
  }
  return transaction;
}

function prepareOrder(account, order, instructions, callback) {
  const transaction = createOrderTransaction(account, order);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(prepareOrder);
