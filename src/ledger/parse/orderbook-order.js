/* @flow */

import * as _ from 'lodash'
import {parseTimestamp, adjustQualityForXRP} from './utils'
import {removeUndefined} from '../../common'

import {orderFlags} from './flags'
import parseAmount from './amount'

function parseOrderbookOrder(order: Object): Object {
  const direction = (order.Flags & orderFlags.Sell) === 0 ? 'buy' : 'sell'
  const takerGetsAmount = parseAmount(order.TakerGets)
  const takerPaysAmount = parseAmount(order.TakerPays)
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount

  // note: immediateOrCancel and fillOrKill orders cannot enter the order book
  // so we can omit those flags here
  const specification = removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((order.Flags & orderFlags.Passive) !== 0) || undefined,
    expirationTime: parseTimestamp(order.Expiration)
  })

  const properties = {
    maker: order.Account,
    sequence: order.Sequence,
    makerExchangeRate: adjustQualityForXRP(order.quality,
      takerGetsAmount.currency, takerPaysAmount.currency)
  }

  const takerGetsFunded = order.taker_gets_funded ?
    parseAmount(order.taker_gets_funded) : undefined
  const takerPaysFunded = order.taker_pays_funded ?
    parseAmount(order.taker_pays_funded) : undefined
  const available = removeUndefined({
    fundedAmount: takerGetsFunded,
    priceOfFundedAmount: takerPaysFunded
  })
  const state = _.isEmpty(available) ? undefined : available
  return removeUndefined({specification, properties, state})
}

export default parseOrderbookOrder
