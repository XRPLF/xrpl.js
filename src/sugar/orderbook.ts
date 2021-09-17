/* eslint-disable max-lines-per-function -- Needs to process orderbooks. */
import BigNumber from 'bignumber.js'
import _ from 'lodash'

import type { Client } from '../client'
import { LedgerIndex } from '../models/common'
import { OfferLedgerFlags } from '../models/ledger/offer'
import {
  BookOffer,
  BookOffersRequest,
  TakerAmount,
} from '../models/methods/bookOffers'

const DEFAULT_LIMIT = 20

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
 * @param this - Client.
 * @param takerPays - Specs of the currency account taking the offer pays.
 * @param takerGets - Specs of the currency account taking the offer receives.
 * @param options - Options to include for getting orderbook between payer and receiver.
 * @returns An object containing buy and sell objects.
 */
// eslint-disable-next-line max-params -- Function needs 4 params.
async function getOrderbook(
  this: Client,
  takerPays: TakerAmount,
  takerGets: TakerAmount,
  options: OrderbookOptions = {},
): Promise<Orderbook> {
  const request: BookOffersRequest = {
    command: 'book_offers',
    taker_pays: takerPays,
    taker_gets: takerGets,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash,
    limit: options.limit ?? DEFAULT_LIMIT,
    taker: options.taker,
  }
  // 2. Make Request
  const directOfferResults = await this.requestAll(request)
  request.taker_gets = takerPays
  request.taker_pays = takerGets
  const reverseOfferResults = await this.requestAll(request)
  // 3. Return Formatted Response
  const directOffers = _.flatMap(
    directOfferResults,
    (directOfferResult) => directOfferResult.result.offers,
  )
  const reverseOffers = _.flatMap(
    reverseOfferResults,
    (reverseOfferResult) => reverseOfferResult.result.offers,
  )

  const orders = [...directOffers, ...reverseOffers]
  // separate out the buy and sell orders
  const buy: BookOffer[] = []
  const sell: BookOffer[] = []
  orders.forEach((order) => {
    // eslint-disable-next-line no-bitwise -- necessary for flags check
    if ((order.Flags & OfferLedgerFlags.lsfSell) === 0) {
      buy.push(order)
    } else {
      sell.push(order)
    }
  })
  // Sort the orders
  // for both buys and sells, lowest quality is closest to mid-market
  // we sort the orders so that earlier orders are closer to mid-market
  return {
    buy: sortOffers(buy).slice(0, options.limit),
    sell: sortOffers(sell).slice(0, options.limit),
  }
}

export default getOrderbook
