/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parseAmount = require('./amount')
const flags = utils.txFlags.OfferCreate

function parseOrder(tx: Object): Object {
  assert(tx.TransactionType === 'OfferCreate')

  const direction = (tx.Flags & flags.Sell) === 0 ? 'buy' : 'sell'
  const takerGetsAmount = parseAmount(tx.TakerGets)
  const takerPaysAmount = parseAmount(tx.TakerPays)
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount

  return utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((tx.Flags & flags.Passive) !== 0) || undefined,
    immediateOrCancel: ((tx.Flags & flags.ImmediateOrCancel) !== 0)
      || undefined,
    fillOrKill: ((tx.Flags & flags.FillOrKill) !== 0) || undefined,
    expirationTime: utils.parseTimestamp(tx.Expiration)
  })
}

module.exports = parseOrder
