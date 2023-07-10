import { LedgerIndex, ResponseOnlyTxInfo } from '../common'
import { Transaction } from '../transactions'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `noripple_check` command provides a quick way to check the status of th
 * default ripple field for an account and the No Ripple flag of its trust
 * lines, compared with the recommended settings. Expects a response in the form
 * of an {@link NoRippleCheckResponse}.
 *
 * @example
 * ```ts
 * const noRipple: NoRippleCheckRequest = {
 *   "id": 0,
 *   "command": "noripple_check",
 *   "account": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
 *    "role": "gateway",
 *   "ledger_index": "current",
 *   "limit": 2,
 *   "transactions": true
 * }
 * ```
 *
 * @category Requests
 */
export interface NoRippleCheckRequest extends BaseRequest {
  command: 'noripple_check'
  /** A unique identifier for the account, most commonly the account's address. */
  account: string
  /**
   * Whether the address refers to a gateway or user. Recommendations depend on
   * the role of the account. Issuers must have Default Ripple enabled and must
   * disable No Ripple on all trust lines. Users should have Default Ripple
   * disabled, and should enable No Ripple on all trust lines.
   */
  role: 'gateway' | 'user'
  /**
   * If true, include an array of suggested transactions, as JSON objects,
   * that you can sign and submit to fix the problems. Defaults to false.
   */
  transactions?: boolean
  /**
   * The maximum number of trust line problems to include in the results.
   * Defaults to 300.
   */
  limit?: number
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /**
   * The ledger index of the ledger to use, or a shortcut string to choose a
   * ledger automatically.
   */
  ledger_index?: LedgerIndex
}

/**
 * Response expected by a {@link NoRippleCheckRequest}.
 *
 * @category Responses
 */
export interface NoRippleCheckResponse extends BaseResponse {
  result: {
    /** The ledger index of the ledger used to calculate these results. */
    ledger_current_index: number
    /**
     * Array of strings with human-readable descriptions of the problems.
     * This includes up to one entry if the account's Default Ripple setting is
     * not as recommended, plus up to limit entries for trust lines whose no
     * ripple setting is not as recommended.
     */
    problems: string[]
    /**
     * If the request specified transactions as true, this is an array of JSON
     * objects, each of which is the JSON form of a transaction that should fix
     * one of the described problems. The length of this array is the same as
     * the problems array, and each entry is intended to fix the problem
     * described at the same index into that array.
     */
    transactions: Array<Transaction & ResponseOnlyTxInfo>
  }
}
