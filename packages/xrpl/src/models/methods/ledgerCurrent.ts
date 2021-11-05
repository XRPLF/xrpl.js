import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The ledger_current method returns the unique identifiers of the current
 * in-progress ledger. Expects a response in the form of a {@link
 * LedgerCurrentResponse}.
 *
 * @example
 * ```ts
 * const ledgerCurrent: LedgerCurrentRequest = {
 *   "command": "ledger_current"
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerCurrentRequest extends BaseRequest {
  command: 'ledger_current'
}

/**
 * Response expected from a {@link LedgerCurrentRequest}.
 *
 * @category Responses
 */
export interface LedgerCurrentResponse extends BaseResponse {
  result: {
    /** The ledger index of this ledger version. */
    ledger_current_index: number
  }
}
