'use strict';
const _ = require('lodash');
const utils = require('./utils');
const flags = utils.core.Remote.flags.offer;
const parseAmount = require('./amount');

function replaceValue(amount, value) {
  return _.assign({}, amount, {value});
}

function parseOrderbookOrder(order: Object): Object {
  const direction = (order.Flags & flags.Sell) === 0 ? 'buy' : 'sell';
  const takerGetsAmount = parseAmount(order.TakerGets);
  const takerPaysAmount = parseAmount(order.TakerPays);
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount;
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount;
  const price = replaceValue(totalPrice, (direction === 'buy') ?
    utils.invertQuality(order.quality) : order.quality);

  const specification = utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    price: price,
    passive: ((order.Flags & flags.Passive) !== 0) || undefined
  });
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
