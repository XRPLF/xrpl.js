/* @flow */
'use strict';
const utils = require('./utils');
const parseAmount = require('./amount');
const orderFlags = utils.core.Transaction.flags.OfferCreate;

/*:: type Amount = string | {currency: string, issuer: string, value: string} */
function parseOrder(takerGets: Amount, takerPays: Amount, flags: number):
    Object {
  const direction = (flags & orderFlags.Sell) === 0 ? 'buy' : 'sell';
  const takerGetsAmount = parseAmount(takerGets);
  const takerPaysAmount = parseAmount(takerPays);
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount;
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount;

  return utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((flags & orderFlags.Passive) !== 0) || undefined,
    immediateOrCancel: ((flags & orderFlags.ImmediateOrCancel) !== 0)
      || undefined,
    fillOrKill: ((flags & orderFlags.FillOrKill) !== 0) || undefined
  });
}

module.exports = parseOrder;
