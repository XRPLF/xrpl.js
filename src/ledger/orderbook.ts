import * as _ from 'lodash'
import * as utils from './utils'
import parseOrderbookOrder from './parse/orderbook-order'
import {validate} from '../common'
import {OrderSpecification} from './types'
import {Amount, Issue} from '../common/types/objects'
import {RippleAPI} from '../api'
import {OfferCreateTransaction} from '../common/types/objects'

export type OrdersOptions = {
  limit?: number,
  ledgerVersion?: number
}

type Orderbook = {
  base: Issue,
  counter: Issue
}
type OrderbookItem = {
   specification: OrderSpecification,
   properties: {
    maker: string,
    sequence: number,
    makerExchangeRate: string
  },
  state?: {
    fundedAmount: Amount,
    priceOfFundedAmount: Amount
  }
}

type OrderbookOrders = Array<OrderbookItem>

type GetOrderbook = {
  bids: OrderbookOrders,
  asks: OrderbookOrders
}

function isSameIssue(a: Amount, b: Amount) {
  return a.currency === b.currency && a.counterparty === b.counterparty
}

function directionFilter(direction: string, order: OrderbookItem) {
  return order.specification.direction === direction
}

function flipOrder(order: OrderbookItem) {
  const specification = order.specification
  const flippedSpecification = {
    quantity: specification.totalPrice,
    totalPrice: specification.quantity,
    direction: specification.direction === 'buy' ? 'sell' : 'buy'
  }
  const newSpecification = _.merge({}, specification, flippedSpecification)
  return _.merge({}, order, {specification: newSpecification})
}

function alignOrder(base: Amount, order: OrderbookItem) {
  const quantity = order.specification.quantity
  return isSameIssue(quantity, base) ? order : flipOrder(order)
}

function formatBidsAndAsks(
  orderbook: Orderbook, offers: OfferCreateTransaction[]) {
  // the "base" currency is the currency that you are buying or selling
  // the "counter" is the currency that the "base" is priced in
  // a "bid"/"ask" is an order to buy/sell the base, respectively
  // for bids: takerGets = totalPrice = counter, takerPays = quantity = base
  // for asks: takerGets = quantity = base, takerPays = totalPrice = counter
  // quality = takerPays / takerGets; price = totalPrice / quantity
  // for bids: lowest quality => lowest quantity/totalPrice => highest price
  // for asks: lowest quality => lowest totalPrice/quantity => lowest price
  // for both bids and asks, lowest quality is closest to mid-market
  // we sort the orders so that earlier orders are closer to mid-market
  const orders = _.sortBy(offers, 'quality').map(parseOrderbookOrder)
  const alignedOrders = orders.map(_.partial(alignOrder, orderbook.base))
  const bids = alignedOrders.filter(_.partial(directionFilter, 'buy'))
  const asks = alignedOrders.filter(_.partial(directionFilter, 'sell'))
  return {bids, asks}
}

// account is to specify a "perspective", which affects which unfunded offers
// are returned
async function makeRequest(
  api: RippleAPI, taker: string, options: OrdersOptions,
  takerGets: Issue, takerPays: Issue
) {
  const orderData = utils.renameCounterpartyToIssuerInOrder({
    taker_gets: takerGets,
    taker_pays: takerPays
  })
  return api._requestAll('book_offers', {
    taker_gets: orderData.taker_gets,
    taker_pays: orderData.taker_pays,
    ledger_index: options.ledgerVersion || 'validated',
    limit: options.limit,
    taker
})
}

export default async function getOrderbook(
  this: RippleAPI,
  address: string,
  orderbook: Orderbook,
  options: OrdersOptions = {}
): Promise<GetOrderbook> {
  // 1. Validate
  validate.getOrderbook({address, orderbook, options})
  // 2. Make Request
  const [directOfferResults, reverseOfferResults] = await Promise.all([
    makeRequest(this, address, options, orderbook.base, orderbook.counter),
    makeRequest(this, address, options, orderbook.counter, orderbook.base)
  ])
  // 3. Return Formatted Response
  const directOffers = _.flatMap(directOfferResults,
    directOfferResult => directOfferResult.offers)
  const reverseOffers = _.flatMap(reverseOfferResults,
    reverseOfferResult => reverseOfferResult.offers)
  return formatBidsAndAsks(orderbook, [...directOffers, ...reverseOffers])
}
