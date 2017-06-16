/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const flags = require('./flags').orderFlags
const parseAmount = require('./amount')

function parseOrderbookOrder(order: Object): Object {
  const direction = (order.Flags & flags.Sell) === 0 ? 'buy' : 'sell'
  const takerGetsAmount = parseAmount(order.TakerGets)
  const takerPaysAmount = parseAmount(order.TakerPays)
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount

  // note: immediateOrCancel and fillOrKill orders cannot enter the order book
  // so we can omit those flags here
  const specification = utils.removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((order.Flags & flags.Passive) !== 0) || undefined,
    expirationTime: utils.parseTimestamp(order.Expiration)
  })

  const properties = {
    maker: order.Account,
    sequence: order.Sequence,
    makerExchangeRate: utils.adjustQualityForXRP(order.quality,
      takerGetsAmount.currency, takerPaysAmount.currency)
  }

  const takerGetsFunded = order.taker_gets_funded ?
      parseAmount(order.taker_gets_funded) : undefined
  const takerPaysFunded = order.taker_pays_funded ?
      parseAmount(order.taker_pays_funded) : undefined
  const available = utils.removeUndefined({
    fundedAmount: takerGetsFunded,
    priceOfFundedAmount: takerPaysFunded
  })
  const state = _.isEmpty(available) ? undefined : available
  return utils.removeUndefined({specification, properties, state})
}

module.exports = parseOrderbookOrder
