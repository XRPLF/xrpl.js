/* @flow */
'use strict';
const assert = require('assert');
const utils = require('./utils');
const parseAmount = require('./amount');
const flags = utils.core.Transaction.flags.OfferCreate;

function parseOrder(tx: Object): Object {
  assert(tx.TransactionType === 'OfferCreate');

  const direction = (tx.Flags & flags.Sell) === 0 ? 'buy' : 'sell';
  const takerGets = parseAmount(tx.TakerGets);
  const takerPays = parseAmount(tx.TakerPays);
  const quantity = (direction === 'buy') ? takerPays : takerGets;
  const totalPrice = (direction === 'buy') ? takerGets : takerPays;

  return {
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: (tx.Flags & flags.Passive) !== 0,
    immediateOrCancel: (tx.Flags & flags.ImmediateOrCancel) !== 0,
    fillOrKill: (tx.Flags & flags.FillOrKill) !== 0
  };
}

module.exports = parseOrder;
