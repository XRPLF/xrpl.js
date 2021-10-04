import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The ledger_closed method returns the unique identifiers of the most recently
 * closed ledger. Expects a response in the form of a {@link
 * LedgerClosedResponse}.
 *
 *  *
 * ```ts
 * const ledgerClosed: LedgerClosedRequest = {
 *   "command": "ledger_closed"
 * }
 * ```
 */
export interface LedgerClosedRequest extends BaseRequest {
  command: 'ledger_closed'
}

/**
 * The response expected from a {@link LedgerClosedRequest}.
 */
export interface LedgerClosedResponse extends BaseResponse {
  result: {
    ledger_hash: string
    ledger_index: number
  }
}
