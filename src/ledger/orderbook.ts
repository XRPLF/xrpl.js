import BigNumber from 'bignumber.js'
import _ from 'lodash'

import { Client } from '../client'
import { LedgerIndex } from '../models/common'
import {
  BookOffer,
  BookOffersRequest,
  TakerAmount,
} from '../models/methods/bookOffers'

import { orderFlags } from './parse/flags'

interface Orderbook {
  buy: BookOffer[]
  sell: BookOffer[]
}

interface Options {
  taker_pays: TakerAmount
  taker_gets: TakerAmount
  limit?: number
  ledger_index?: LedgerIndex
  ledger_hash?: string
  taker?: string
}

/**
 * Fetch orderbook (buy/sell orders) between two accounts.
 *
 * @param client - Client.
 * @param options - Options to include for getting orderbook between payer and receiver.
 * @returns An object containing buy and sell objects.
 */
export default async function getOrderbook(
  client: Client,
  options: Options,
): Promise<Orderbook> {
  const request: BookOffersRequest = {
    command: 'book_offers',
    taker_pays: options.taker_pays,
    taker_gets: options.taker_gets,
    ledger_index: options.ledger_index,
    ledger_hash: options.ledger_hash,
    limit: options.limit,
    taker: options.taker,
  }
  // 2. Make Request
  const directOfferResults = await client.requestAll(request)
  request.taker_gets = options.taker_pays
  request.taker_pays = options.taker_gets
  const reverseOfferResults = await client.requestAll(request)
  // 3. Return Formatted Response
  const directOffers = _.flatMap(
    directOfferResults,
    (directOfferResult) => directOfferResult.result.offers,
  )
  const reverseOffers = _.flatMap(
    reverseOfferResults,
    (reverseOfferResult) => reverseOfferResult.result.offers,
  )
  // Sort the orders
  // for both buys and sells, lowest quality is closest to mid-market
  // we sort the orders so that earlier orders are closer to mid-market

  const orders = [...directOffers, ...reverseOffers].sort((a, b) => {
    const qualityA = a.quality ?? 0
    const qualityB = b.quality ?? 0

    return new BigNumber(qualityA).comparedTo(qualityB)
  })
  // separate out the orders amongst buy and sell
  const buy: BookOffer[] = []
  const sell: BookOffer[] = []
  orders.forEach((order) => {
    if (order.Flags === orderFlags.Sell) {
      sell.push(order)
    } else {
      buy.push(order)
    }
  })
  return { buy, sell }
}
