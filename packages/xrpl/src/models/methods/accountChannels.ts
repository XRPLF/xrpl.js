import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * Represents a payment channel in the XRP Ledger.
 */
export interface Channel {
  /** The owner of the channel, as an Address. */
  account: string

  /** The total amount of XRP, in drops allocated to this channel. */
  amount: string

  /**
   * The total amount of XRP, in drops, paid out from this channel,
   * as of the ledger version used. (You can calculate the amount of
   * XRP left in the channel by subtracting balance from amount.)
   */
  balance: string

  /**
   * A unique ID for this channel, as a 64-character hexadecimal string.
   * This is also the ID of the channel object in the ledger's state data.
   */
  channel_id: string

  /**
   * The destination account of the channel, as an Address.
   * Only this account can receive the XRP in the channel while it is open.
   */
  destination_account: string

  /**
   * The number of seconds the payment channel must stay open after the owner
   * of the channel requests to close it.
   */
  settle_delay: number

  /**
   * The public key for the payment channel in the XRP Ledger's base58 format.
   * Signed claims against this channel must be redeemed with the matching key pair.
   */
  public_key?: string

  /**
   * The public key for the payment channel in hexadecimal format, if one was
   * specified at channel creation. Signed claims against this channel must be
   * redeemed with the matching key pair.
   */
  public_key_hex?: string

  /**
   * Time, in seconds since the Ripple Epoch, when this channel is set to expire.
   * This expiration date is mutable. If this is before the close time of the most
   * recent validated ledger, the channel is expired.
   */
  expiration?: number

  /**
   * Time, in seconds since the Ripple Epoch, of this channel's immutable expiration,
   * if one was specified at channel creation. If this is before the close time of the
   * most recent validated ledger, the channel is expired.
   */
  cancel_after?: number

  /**
   * A 32-bit unsigned integer to use as a source tag for payments through this payment channel,
   * if one was specified at channel creation. This indicates the payment channel's originator or
   * other purpose at the source account. Conventionally, if you bounce payments from this channel,
   * you should specify this value in the DestinationTag of the return payment.
   */
  source_tag?: number

  /**
   * A 32-bit unsigned integer to use as a destination tag for payments through this channel,
   * if one was specified at channel creation. This indicates the payment channel's beneficiary
   * or other purpose at the destination account.
   */
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
