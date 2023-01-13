/* eslint-disable max-lines-per-function -- Needs to process orderbooks. */
import BigNumber from 'bignumber.js'
import flatMap from 'lodash/flatMap'

import type { Client } from '../client'
import { ValidationError } from '../errors'
import { LedgerIndex } from '../models/common'
import { OfferFlags } from '../models/ledger/Offer'
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

const getOrderbookOptionsSet = new Set([
  'limit',
  'ledger_index',
  'ledger_hash',
  'taker',
])

/**
 * Fetch orderbook (buy/sell orders) between two accounts.
 *
 * @param this - Client.
 * @param takerPays - Specification of which currency the account taking the
 * offer would pay, as an object with `currency` and `issuer` fields.
 * @param takerGets - Specification of which currency the account taking the
 * offer would receive, as an object with `currency` and `issuer` fields.
 * @param options - Options allowing the client to specify ledger_index,
 * ledger_hash, filter by taker, and/or limit number of orders.
 * @param options.ledger_index - Retrieve the orderbook at a given ledger_index.
 * @param options.ledger_hash - Retrieve the orderbook at the ledger with a
 * given ledger_hash.
 * @param options.taker - Filter orders by taker.
 * @param options.limit - Limit number of order books to fetch for each side of
 * the order book. Defaults to 20.
 * @returns An object containing buy and sell objects.
 */
// eslint-disable-next-line max-params, complexity -- Once bound to Client, getOrderbook only has 3 parameters.
async function getOrderbook(
  this: Client,
  takerPays: TakerAmount,
  takerGets: TakerAmount,
  options: {
    limit?: number
    ledger_index?: LedgerIndex
    ledger_hash?: string | null
    taker?: string | null
  } = {},
): Promise<{
  buy: BookOffer[]
  sell: BookOffer[]
}> {
  Object.keys(options).forEach((key) => {
    if (!getOrderbookOptionsSet.has(key)) {
      throw new ValidationError(`Unexpected option: ${key}`, options)
    }
  })

  if (options.limit && typeof options.limit !== 'number') {
    throw new ValidationError('limit must be a number', options.limit)
  }

  if (
    options.ledger_index &&
    !(
      typeof options.ledger_index === 'number' ||
      (typeof options.ledger_index === 'string' &&
        ['validated', 'closed', 'current'].includes(options.ledger_index))
    )
  ) {
    throw new ValidationError(
      'ledger_index must be a number or a string of "validated", "closed", or "current"',
      options.ledger_index,
    )
  }

  if (
    options.ledger_hash !== undefined &&
    options.ledger_hash !== null &&
    typeof options.ledger_hash !== 'string'
  ) {
    throw new ValidationError(
      'ledger_hash must be a string',
      options.ledger_hash,
    )
  }

  if (options.taker !== undefined && typeof options.taker !== 'string') {
    throw new ValidationError('taker must be a string', options.taker)
  }

  const request: BookOffersRequest = {
    command: 'book_offers',
    taker_pays: takerPays,
    taker_gets: takerGets,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash === null ? undefined : options.ledger_hash,
    limit: options.limit ?? DEFAULT_LIMIT,
    taker: options.taker ? options.taker : undefined,
  }
  // 2. Make Request
  const directOfferResults = await this.requestAll(request)
  request.taker_gets = takerPays
  request.taker_pays = takerGets
  const reverseOfferResults = await this.requestAll(request)
  // 3. Return Formatted Response
  const directOffers = flatMap(
    directOfferResults,
    (directOfferResult) => directOfferResult.result.offers,
  )
  const reverseOffers = flatMap(
    reverseOfferResults,
    (reverseOfferResult) => reverseOfferResult.result.offers,
  )

  const orders = [...directOffers, ...reverseOffers]
  // separate out the buy and sell orders
  const buy: BookOffer[] = []
  const sell: BookOffer[] = []
  orders.forEach((order) => {
    // eslint-disable-next-line no-bitwise -- necessary for flags check
    if ((order.Flags & OfferFlags.lsfSell) === 0) {
      buy.push(order)
    } else {
      sell.push(order)
    }
  })
  /*
   * Sort the orders
   * for both buys and sells, lowest quality is closest to mid-market
   * we sort the orders so that earlier orders are closer to mid-market
   */
  return {
    buy: sortOffers(buy).slice(0, options.limit),
    sell: sortOffers(sell).slice(0, options.limit),
  }
}

export default getOrderbook
