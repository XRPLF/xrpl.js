import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

export interface AccountLinesTrustline {
  /** The unique Address of the counterparty to this trust line. */
  account: string
  /**
   * Representation of the numeric balance currently held against this line. A
   * positive balance means that the perspective account holds value; a negative
   * Balance means that the perspective account owes value.
   */
  balance: string
  /** A Currency Code identifying what currency this trust line can hold. */
  currency: string
  /**
   * The maximum amount of the given currency that this account is willing to
   * owe the peer account.
   */
  limit: string
  /**
   * The maximum amount of currency that the issuer account is willing to owe
   * the perspective account.
   */
  limit_peer: string
  /**
   * Rate at which the account values incoming balances on this trust line, as
   * a ratio of this value per 1 billion units. (For example, a value of 500
   * million represents a 0.5:1 ratio.) As a special case, 0 is treated as a
   * 1:1 ratio.
   */
  quality_in: number
  /**
   * Rate at which the account values outgoing balances on this trust line, as
   * a ratio of this value per 1 billion units. (For example, a value of 500
   * million represents a 0.5:1 ratio.) As a special case, 0 is treated as a 1:1
   * ratio.
   */
  quality_out: number
  /**
   * If true, this account has enabled the No Ripple flag for this trust line.
   * If present and false, this account has disabled the No Ripple flag, but,
   * because the account also has the Default Ripple flag enabled, that is not
   * considered the default state. If omitted, the account has the No Ripple
   * flag disabled for this trust line and Default Ripple disabled.
   */
  no_ripple?: boolean
  /**
   * If true, the peer account has enabled the No Ripple flag for this trust
   * line. If present and false, this account has disabled the No Ripple flag,
   * but, because the account also has the Default Ripple flag enabled, that is
   * not considered the default state. If omitted, the account has the No Ripple
   * flag disabled for this trust line and Default Ripple disabled.
   */
  no_ripple_peer?: boolean
  /** If true, this account has authorized this trust line. The default is false. */
  authorized?: boolean
  /** If true, the peer account has authorized this trust line. The default is false. */
  peer_authorized?: boolean
  /** If true, this account has frozen this trust line. The default is false. */
  freeze?: boolean
  /**
   * If true, the peer account has frozen this trust line. The default is
   * false.
   */
  freeze_peer?: boolean
}

/**
 * The account_lines method returns information about an account's trust lines,
 *  including balances in all non-XRP currencies and assets. All information
 * retrieved is relative to a particular version of the ledger. Expects an
 * {@link AccountLinesResponse}.
 *
 * @category Requests
 */
export interface AccountLinesRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'account_lines'
  /** A unique identifier for the account, most commonly the account's Address. */
  account: string
  /**
   * The Address of a second account. If provided, show only lines of trust
   * connecting the two accounts.
   */
  peer?: string
  /**
   * Limit the number of trust lines to retrieve. The server is not required to
   * honor this value. Must be within the inclusive range 10 to 400.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * Response expected from an {@link AccountLinesRequest}.
 *
 * @category Responses
 */
export interface AccountLinesResponse extends BaseResponse {
  result: {
    /**
     * Unique Address of the account this request corresponds to. This is the
     * "perspective account" for purpose of the trust lines.
     */
    account: string
    /**
     * Array of trust line objects. If the number of trust lines is large, only
     * returns up to the limit at a time.
     */
    lines: AccountLinesTrustline[]
    /**
     * The ledger index of the current open ledger, which was used when
     * retrieving this information.
     */
    ledger_current_index?: number
    /**
     * The ledger index of the ledger version that was used when retrieving
     * this data.
     */
    ledger_index?: number
    /**
     * The identifying hash the ledger version that was used when retrieving
     * this data.
     */
    ledger_hash?: string
    /**
     * Server-defined value indicating the response is paginated. Pass this to
     * the next call to resume where this call left off. Omitted when there are
     * No additional pages after this one.
     */
    marker?: unknown
  }
}
