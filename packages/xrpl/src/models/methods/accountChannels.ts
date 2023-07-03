import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

export interface Channel {
  account: string
  amount: string
  balance: string
  channel_id: string
  destination_account: string
  settle_delay: number
  public_key?: string
  public_key_hex?: string
  expiration?: number
  cancel_after?: number
  source_tab?: number
  destination_tag?: number
}

/**
 * The account_channels method returns information about an account's Payment
 * Channels. This includes only channels where the specified account is the
 * channel's source, not the destination. (A channel's "source" and "owner" are
 * the same.) All information retrieved is relative to a particular version of
 * the ledger. Returns an {@link AccountChannelsResponse}.
 *
 * @category Requests
 */
export interface AccountChannelsRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'account_channels'
  /**
   * The unique identifier of an account, typically the account's address. The
   * request returns channels where this account is the channel's owner/source.
   *
   */
  account: string
  /**
   * The unique identifier of an account, typically the account's address. If
   * provided, filter results to payment channels whose destination is this
   * account.
   */
  destination_account?: string
  /**
   * Limit the number of transactions to retrieve. Cannot be less than 10 or
   * more than 400. The default is 200.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * The expected response from an {@link AccountChannelsRequest}.
 *
 * @category Responses
 */
export interface AccountChannelsResponse extends BaseResponse {
  result: {
    /**
     * The address of the source/owner of the payment channels. This
     * corresponds to the account field of the request.
     */
    account: string
    /** Payment channels owned by this account. */
    channels: Channel[]
    /**
     * The identifying hash of the ledger version used to generate this
     * response.
     */
    ledger_hash: string
    /** The ledger index of the ledger version used to generate this response. */
    ledger_index: number
    /**
     * If true, the information in this response comes from a validated ledger
     * version. Otherwise, the information is subject to change.
     */
    validated?: boolean
    /**
     * The limit to how many channel objects were actually returned by this
     * request.
     */
    limit?: number
    /**
     * Server-defined value for pagination. Pass this to the next call to
     * resume getting results where this call left off. Omitted when there are
     * no additional pages after this one.
     */
    marker?: unknown
  }
}
