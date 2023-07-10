import { Currency, StreamType } from '../common'

import type { BaseRequest, BaseResponse } from './baseMethod'

export interface UnsubscribeBook {
  taker_gets: Currency
  taker_pays: Currency
  both?: boolean
}

/**
 * The unsubscribe command tells the server to stop sending messages for a
 * particular subscription or set of subscriptions. Expects a response in the
 * form of an {@link UnsubscribeResponse}.
 *
 * @category Requests
 */
export interface UnsubscribeRequest extends BaseRequest {
  command: 'unsubscribe'
  /**
   * Array of string names of generic streams to unsubscribe from, including.
   * Ledger, server, transactions, and transactions_proposed.
   */
  streams?: StreamType[]
  /**
   * Array of unique account addresses to stop receiving updates for, in the.
   * XRP Ledger's base58 format.
   */
  accounts?: string[]
  /**
   * Like accounts, but for accounts_proposed subscriptions that included
   * not-yet-validated transactions.
   */
  accounts_proposed?: string[]
  /**
   * Array of objects defining order books to unsubscribe from, as explained
   * below.
   */
  books?: UnsubscribeBook[]
}

/**
 * Response expected from a {@link UnsubscribeRequest}.
 *
 * @category Responses
 */
export interface UnsubscribeResponse extends BaseResponse {
  result: Record<string, never>
}
