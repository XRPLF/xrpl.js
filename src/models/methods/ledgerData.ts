import { LedgerIndex } from '../common'
import { LedgerEntry } from '../ledger'

import { BaseRequest, BaseResponse } from './baseMethod'

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
export interface LedgerDataRequest extends BaseRequest {
  command: 'ledger_data'
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /**
   * The ledger index of the ledger to use, or a shortcut string to choose a
   * ledger automatically.
   */
  ledger_index?: LedgerIndex
  /**
   * If set to true, return ledger objects as hashed hex strings instead of
   * JSON.
   */
  binary?: boolean
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
}

type LabeledLedgerEntry = { ledgerEntryType: string } & LedgerEntry

interface BinaryLedgerEntry {
  data: string
}

type State = { index: string } & (BinaryLedgerEntry | LabeledLedgerEntry)

/**
 * The response expected from a {@link LedgerDataRequest}.
 *
 * @category Responses
 */
export interface LedgerDataResponse extends BaseResponse {
  result: {
    /** The ledger index of this ledger version. */
    ledger_index: number
    /** Unique identifying hash of this ledger version. */
    ledger_hash: string
    /**
     * Array of JSON objects containing data from the ledger's state tree,
     * as defined below.
     */
    state: State[]
    /**
     * Server-defined value indicating the response is paginated. Pass this to
     * the next call to resume where this call left off.
     */
    marker?: unknown
    validated?: boolean
  }
}
