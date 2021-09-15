import BigNumber from 'bignumber.js'
import _ from 'lodash'

import type { Client } from '../client'
import { LedgerIndex } from '../models/common'
import {
  BookOffer,
  BookOffersRequest,
  TakerAmount,
} from '../models/methods/bookOffers'

import { orderFlags } from './parse/flags'

function sortOffers(offers: BookOffer[]): BookOffer[] {
  return offers.sort((offerA, offerB) => {
    const qualityA = offerA.quality ?? 0
    const qualityB = offerB.quality ?? 0

    return new BigNumber(qualityA).comparedTo(qualityB)
  })
}

interface Orderbook {
  buy: BookOffer[]
  sell: BookOffer[]
}

interface OrderbookOptions {
  limit?: number
  ledger_index?: LedgerIndex
  ledger_hash?: string
  taker?: string
}

/**
 * Fetch orderbook (buy/sell orders) between two accounts.
 *
 * @param client - Client.
 * @param taker_pays - Specs of the currency account taking the offer pays.
 * @param taker_gets - Specs of the currency account taking the offer receives.
 * @param takerPays
 * @param takerGets
 * @param options - Options to include for getting orderbook between payer and receiver.
 * @returns An object containing buy and sell objects.
 */
// eslint-disable-next-line max-params -- Function needs 4 params.
async function getOrderbook(
  client: Client,
  takerPays: TakerAmount,
  takerGets: TakerAmount,
  options: OrderbookOptions,
): Promise<Orderbook> {
  const request: BookOffersRequest = {
    command: 'book_offers',
    taker_pays: takerPays,
    taker_gets: takerGets,
    ledger_index: options.ledger_index,
    ledger_hash: options.ledger_hash,
    limit: options.limit,
    taker: options.taker,
  }
  // 2. Make Request
  const directOfferResults = await client.requestAll(request)
  request.taker_gets = takerPays
  request.taker_pays = takerGets
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

  const orders = [...directOffers, ...reverseOffers]
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
  return { buy: sortOffers(buy), sell: sortOffers(sell) }
}

export default getOrderbook
