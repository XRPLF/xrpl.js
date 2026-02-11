import { Amendments, FeeSettings, LedgerHashes } from '../ledger'
import { LedgerEntry, LedgerEntryFilter } from '../ledger/LedgerEntry'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

export type AccountSponsoringObjectType = Exclude<
  LedgerEntryFilter,
  'amendments' | 'fee' | 'hashes'
>

/**
 * The account_sponsoring command returns a list of objects that an account is
 * sponsoring; namely, a list of objects where the Sponsor is the given account.
 * This is a Clio-specific RPC method.
 *
 * @category Requests
 */
export interface AccountSponsoringRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'account_sponsoring'
  /** The sponsor account to get sponsored objects for. */
  account: string
  /**
   * If true, the response only includes objects that would block this account
   * from being deleted. The default is false.
   */
  deletion_blockers_only?: boolean
  /**
   * Filter results by a ledger entry type. Some examples are 'offer' and 'escrow'.
   */
  type?: AccountSponsoringObjectType
  /**
   * The maximum number of objects to include in the results.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * Sponsored objects can be any ledger entry type except Amendments, FeeSettings,
 * and LedgerHashes.
 */
export type SponsoredObject = Exclude<
  LedgerEntry,
  Amendments | FeeSettings | LedgerHashes
>

/**
 * Response expected from an {@link AccountSponsoringRequest}.
 *
 * @category Responses
 */
export interface AccountSponsoringResponse extends BaseResponse {
  result: {
    /** The account this request corresponds to. */
    account: string
    /**
     * Array of ledger entries that this account is sponsoring. Each object
     * is in its raw ledger format.
     */
    sponsored_objects: SponsoredObject[]
    /**
     * The identifying hash of the ledger that was used to generate this
     * response.
     */
    ledger_hash?: string
    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_index?: number
    /**
     * The ledger index of the current in-progress ledger version, which was
     * used to generate this response.
     */
    ledger_current_index?: number
    /** The limit that was used in this request, if any. */
    limit?: number
    /**
     * Server-defined value indicating the response is paginated. Pass this to
     * the next call to resume where this call left off. Omitted when there are
     * no additional pages after this one.
     */
    marker?: unknown
    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}
