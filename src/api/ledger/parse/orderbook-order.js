'use strict';
const _ = require('lodash');
const utils = require('./utils');
const flags = utils.core.Remote.flags.offer;
const parseAmount = require('./amount');

function parseOrderbookOrder(order: Object): Object {
  const direction = (order.Flags & flags.Sell) === 0 ? 'buy' : 'sell';
  const takerGetsAmount = parseAmount(order.TakerGets);
  const takerPaysAmount = parseAmount(order.TakerPays);
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount;
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount;

  const specification = utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((order.Flags & flags.Passive) !== 0) || undefined
  });
  // "quality" is omitted intentionally as it corresponds to
  // either price or inverse price, and it is better to avoid
  // inverting floats where precision issues can arise
  const properties = {
    maker: order.Account,
    sequence: order.Sequence
  };
  const takerGetsFunded = order.taker_gets_funded ?
      parseAmount(order.taker_gets_funded) : undefined;
  const takerPaysFunded = order.taker_pays_funded ?
      parseAmount(order.taker_pays_funded) : undefined;
  const available = utils.removeUndefined({
    availableQuantity: direction === 'buy' ? takerPaysFunded : takerGetsFunded,
    priceOfAvailableQuantity: direction === 'buy' ?
      takerGetsFunded : takerPaysFunded
  });
  const state = _.isEmpty(available) ? undefined : available;
  return utils.removeUndefined({specification, properties, state});
}

module.exports = parseOrderbookOrder;
