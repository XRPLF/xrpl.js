import BigNumber from 'bignumber.js'

import type { Client } from '../client'
import { ValidationError } from '../errors'
import { LedgerIndex } from '../models/common'
import { OfferFlags } from '../models/ledger/Offer'
import {
  BookOffer,
  BookOfferCurrency,
  BookOffersRequest,
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
 * Represents the options for retrieving the order book.
 */
export interface GetOrderBookOptions {
  /**
   * The limit on the number of offers to return.
   */
  limit?: number
  /**
   * The ledger index of the ledger to use.
   */
  ledger_index?: LedgerIndex
  /**
   * The ledger hash of the ledger to use.
   */
  ledger_hash?: string | null
  /**
   * The account that takes the offers.
   */
  taker?: string | null
}

/**
 * Validates the options for retrieving the order book.
 *
 * @param options - The options to validate.
 * @throws {ValidationError} If any validation errors occur.
 */
// eslint-disable-next-line complexity -- Necessary for validation.
export function validateOrderbookOptions(options: GetOrderBookOptions): void {
  for (const key of Object.keys(options)) {
    if (!getOrderbookOptionsSet.has(key)) {
      throw new ValidationError(`Unexpected option: ${key}`, options)
    }
  }

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
}

/**
 * Creates a request object for retrieving book offers.
 *
 * @param currency1 - The first currency in the pair.
 * @param currency2 - The second currency in the pair.
 * @param options - Additional options for the request.
 * @param [options.limit] - The maximum number of offers to retrieve.
 * @param [options.ledger_index] - The ledger index to use for retrieval.
 * @param [options.ledger_hash] - The ledger hash to use for retrieval.
 * @param [options.taker] - The taker address for retrieval.
 * @returns The created request object.
 */
export function createBookOffersRequest(
  currency1: BookOfferCurrency,
  currency2: BookOfferCurrency,
  options: {
    limit?: number
    ledger_index?: LedgerIndex
    ledger_hash?: string | null
    taker?: string | null
  },
): BookOffersRequest {
  const request: BookOffersRequest = {
    command: 'book_offers',
    taker_pays: currency1,
    taker_gets: currency2,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash === null ? undefined : options.ledger_hash,
    limit: options.limit ?? DEFAULT_LIMIT,
    taker: options.taker ? options.taker : undefined,
  }

  return request
}

type BookOfferResult = BookOffer[]

/**
 * Retrieves all book offer results using the given request.
 *
 * @param client - The Ripple client.
 * @param request - The request object.
 * @returns The array of book offer results.
 */
export async function requestAllOffers(
  client: Client,
  request: BookOffersRequest,
): Promise<BookOfferResult[]> {
  const results = await client.requestAll(request)
  return results.map((result) => result.result.offers)
}

/**
 * Creates a reverse request object by swapping the taker pays and taker gets amounts.
 *
 * @param request - The original request object.
 * @returns The reverse request object.
 */
export function reverseRequest(request: BookOffersRequest): BookOffersRequest {
  return {
    ...request,
    taker_pays: request.taker_gets,
    taker_gets: request.taker_pays,
  }
}

/**
 * Extracts the offers from the book offer results.
 *
 * @param offerResults - The array of book offer results.
 * @returns The extracted offers.
 */
export function extractOffers(offerResults: BookOfferResult[]): BookOffer[] {
  return offerResults.flatMap((offerResult) => offerResult)
}

/**
 * Combines the direct and reverse offers into a single array.
 *
 * @param directOffers - The direct offers.
 * @param reverseOffers - The reverse offers.
 * @returns The combined array of offers.
 */
export function combineOrders(
  directOffers: BookOffer[],
  reverseOffers: BookOffer[],
): BookOffer[] {
  return [...directOffers, ...reverseOffers]
}

/**
 * Separates the buy and sell orders from the given array of orders.
 *
 * @param orders - The array of orders.
 * @returns The separated buy and sell orders.
 */
export function separateBuySellOrders(orders: BookOffer[]): {
  buy: BookOffer[]
  sell: BookOffer[]
} {
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

  return { buy, sell }
}

/**
 * Sorts and limits the given array of offers.
 *
 * @param offers - The array of offers to sort and limit.
 * @param [limit] - The maximum number of offers to include.
 * @returns The sorted and limited array of offers.
 */
export function sortAndLimitOffers(
  offers: BookOffer[],
  limit?: number,
): BookOffer[] {
  const sortedOffers = sortOffers(offers)
  return sortedOffers.slice(0, limit)
}
