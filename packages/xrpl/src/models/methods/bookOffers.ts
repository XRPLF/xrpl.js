import { Amount } from '../common'
import { Offer } from '../ledger'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

export interface BookOfferCurrency {
  currency: string
  issuer?: string
}

/**
 * The book_offers method retrieves a list of offers, also known as the order.
 * Book, between two currencies. Returns an {@link BookOffersResponse}.
 *
 * @category Requests
 */
export interface BookOffersRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'book_offers'
  /**
   * If provided, the server does not provide more than this many offers in the
   * results. The total number of results returned may be fewer than the limit,
   * because the server omits unfunded offers.
   */
  limit?: number
  /**
   * The Address of an account to use as a perspective. Unfunded offers placed
   * by this account are always included in the response.
   */
  taker?: string
  /**
   * Specification of which currency the account taking the offer would
   * receive, as an object with currency and issuer fields (omit issuer for
   * XRP), like currency amounts.
   */
  taker_gets: BookOfferCurrency
  /**
   * Specification of which currency the account taking the offer would pay, as
   * an object with currency and issuer fields (omit issuer for XRP), like
   * currency amounts.
   */
  taker_pays: BookOfferCurrency
  /**
   * The object ID of a PermissionedDomain object. If this field is provided,
   * the response will include only valid domain offers associated with that
   * specific domain. If omitted, the response will include only hybrid and open
   * offers for the trading pair, excluding all domain-specific offers.
   */
  domain?: string
}

export interface BookOffer extends Offer {
  /**
   * Amount of the TakerGets currency the side placing the offer has available
   * to be traded. (XRP is represented as drops; any other currency is
   * represented as a decimal value.) If a trader has multiple offers in the
   * same book, only the highest-ranked offer includes this field.
   */
  owner_funds?: string
  /**
   * The maximum amount of currency that the taker can get, given the funding
   * status of the offer.
   */
  taker_gets_funded?: Amount
  /**
   * The maximum amount of currency that the taker would pay, given the funding
   * status of the offer.
   */
  taker_pays_funded?: Amount
  /**
   * The exchange rate, as the ratio taker_pays divided by taker_gets. For
   * fairness, offers that have the same quality are automatically taken
   * first-in, first-out.
   */
  quality?: string
}

/**
 * Expected response from a {@link BookOffersRequest}.
 *
 * @category Responses
 */
export interface BookOffersResponse extends BaseResponse {
  result: {
    /**
     * The ledger index of the current in-progress ledger version, which was
     * used to retrieve this information.
     */
    ledger_current_index?: number
    /**
     * The ledger index of the ledger version that was used when retrieving
     * this data, as requested.
     */
    ledger_index?: number
    /**
     * The identifying hash of the ledger version that was used when retrieving
     * this data, as requested.
     */
    ledger_hash?: string
    /** Array of offer objects, each of which has the fields of an Offer object. */
    offers: BookOffer[]
    validated?: boolean
  }
}
