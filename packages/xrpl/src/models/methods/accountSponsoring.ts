import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * Represents an account that is being sponsored by the requested account.
 *
 * @category Responses
 */
export interface SponsoredAccount {
  /** The address of the sponsored account. */
  account: string
  /**
   * The number of ledger objects owned by this account that are sponsored
   * by the requested account.
   */
  sponsored_owner_count?: number
  /**
   * Indicates whether the account's base reserve is being sponsored by the
   * requested account.
   */
  account_reserve_sponsored?: boolean
}

/**
 * The account_sponsoring command returns information about accounts and ledger
 * objects that are sponsored by the specified account. This is a Clio-only
 * method that provides details about sponsorship relationships for XLS-68.
 * Expects a response in the form of an {@link AccountSponsoringResponse}.
 *
 * @category Requests
 */
export interface AccountSponsoringRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'account_sponsoring'
  /**
   * A unique identifier for the account, most commonly the account's address.
   * This is the sponsor account whose sponsorships will be returned.
   */
  account: string
  /**
   * The maximum number of sponsored accounts to include in the results. Must be
   * within the inclusive range 10 to 400 on non-admin connections. The default
   * is 200.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * Response expected from an {@link AccountSponsoringRequest}.
 *
 * @category Responses
 */
export interface AccountSponsoringResponse extends BaseResponse {
  result: {
    /** The address of the sponsor account from the request. */
    account: string
    /**
     * Array of accounts and objects sponsored by this account. Each entry
     * contains information about the sponsorship relationship.
     */
    sponsored_accounts: SponsoredAccount[]
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

