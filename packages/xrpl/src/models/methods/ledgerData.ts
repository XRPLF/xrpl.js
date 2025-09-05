import { LedgerEntry, LedgerEntryFilter } from '../ledger'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `ledger_data` method retrieves contents of the specified ledger. You can
 * iterate through several calls to retrieve the entire contents of a single
 * ledger version.
 *
 * @example
 * ```ts
 * const ledgerData: LedgerDataRequest = {
 *   "id": 2,
 *   "ledger_hash": "842B57C1CC0613299A686D3E9F310EC0422C84D3911E5056389AA7E5808A93C8",
 *   "command": "ledger_data",
 *   "limit": 5,
 *   "binary": true
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerDataRequest<Binary extends boolean = false>
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'ledger_data'
  /**
   * If set to true, return ledger objects as hashed hex strings instead of
   * JSON.
   */
  binary?: Binary
  /**
   * Limit the number of ledger objects to retrieve. The server is not required
   * to honor this value.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
  /**
   * If included, filter results to include only this type of ledger object.
   */
  type?: LedgerEntryFilter
}

export type LedgerDataLabeledLedgerEntry = {
  ledgerEntryType: string
} & LedgerEntry

export interface LedgerDataBinaryLedgerEntry {
  data: string
}

export type LedgerDataLedgerState<Binary extends boolean = false> = {
  index: string
} & (Binary extends true
  ? LedgerDataBinaryLedgerEntry
  : LedgerDataLabeledLedgerEntry)

/**
 * The response expected from a {@link LedgerDataRequest}.
 *
 * @category Responses
 */
export interface LedgerDataResponse<Binary extends boolean = false>
  extends BaseResponse {
  result: {
    /** The ledger index of this ledger version. */
    ledger_index: number
    /** Unique identifying hash of this ledger version. */
    ledger_hash: string
    /**
     * Array of JSON objects containing data from the ledger's state tree,
     * as defined below.
     */
    state: Array<LedgerDataLedgerState<Binary>>
    /**
     * Server-defined value indicating the response is paginated. Pass this to
     * the next call to resume where this call left off.
     */
    marker?: unknown
    validated?: boolean
  }
}
