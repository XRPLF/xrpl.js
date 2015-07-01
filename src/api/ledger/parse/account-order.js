'use strict';
const utils = require('./utils');
const flags = utils.core.Remote.flags.offer;
const parseAmount = require('./amount');

// rippled 'account_offers' returns a different format for orders than 'tx'
// the flags are also different
function parseAccountOrder(order: Object): Object {
  const direction = (order.flags & flags.Sell) === 0 ? 'buy' : 'sell';
  const takerGetsAmount = parseAmount(order.taker_gets);
  const takerPaysAmount = parseAmount(order.taker_pays);
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount;
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount;

  const specification = utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((order.flags & flags.Passive) !== 0) || undefined
  });
  const properties = {
    sequence: order.seq
  };
  return {specification, properties};
}

module.exports = parseAccountOrder;
