/* @flow */
'use strict';
const utils = require('./utils');
const flags = require('./flags').orderFlags;
const parseAmount = require('./amount');
const BigNumber = require('bignumber.js');

// TODO: remove this function once rippled provides quality directly
function computeQuality(takerGets, takerPays) {
  const quotient = new BigNumber(takerPays.value).dividedBy(takerGets.value);
  return quotient.toDigits(16, BigNumber.ROUND_HALF_UP).toString();
}

// rippled 'account_offers' returns a different format for orders than 'tx'
// the flags are also different
function parseAccountOrder(address: string, order: Object): Object {
  const direction = (order.flags & flags.Sell) === 0 ? 'buy' : 'sell';
  const takerGetsAmount = parseAmount(order.taker_gets);
  const takerPaysAmount = parseAmount(order.taker_pays);
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount;
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount;

  // note: immediateOrCancel and fillOrKill orders cannot enter the order book
  // so we can omit those flags here
  const specification = utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((order.flags & flags.Passive) !== 0) || undefined,
    // rippled currently does not provide "expiration" in account_offers
    expirationTime: utils.parseTimestamp(order.expiration)
  });

  const properties = {
    maker: address,
    sequence: order.seq,
    makerExchangeRate: order.quality ? order.quality.toString()
      : computeQuality(takerGetsAmount, takerPaysAmount)
  };

  return {specification, properties};
}

module.exports = parseAccountOrder;
