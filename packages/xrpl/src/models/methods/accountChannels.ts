import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * Represents a payment channel.
 */
export interface Channel {
  // Required Fields
  /**
   * The source address that owns this payment channel.
   * This comes from the sending address of the transaction that created the channel.
   */
  Account: string

  /**
   * Total XRP, in drops, that has been allocated to this channel.
   * This includes XRP that has been paid to the destination address.
   * This is initially set by the transaction that created the channel
   * and can be increased if the source address sends a PaymentChannelFund transaction.
   */
  Amount: string

  /**
   * Total XRP, in drops, already paid out by the channel.
   * The difference between this value and the Amount field is how much XRP
   * can still be paid to the destination address with PaymentChannelClaim transactions.
   * If the channel closes, the remaining difference is returned to the source address.
   */
  Balance: string

  /**
   * The destination address for this payment channel.
   * While the payment channel is open, this address is the only one that can receive XRP from the channel.
   * This comes from the Destination field of the transaction that created the channel.
   */
  Destination: string

  /**
   * The value 0x0078, mapped to the string PayChannel,
   * indicates that this is a payment channel entry.
   */
  LedgerEntryType: string

  /**
   * A hint indicating which page of the source address's owner directory links to this entry,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string

  /**
   * The identifying hash of the transaction that most recently modified this entry.
   */
  PreviousTxnID: string

  /**
   * The index of the ledger that contains the transaction that most recently modified this entry.
   */
  PreviousTxnLgrSeq: number

  /**
   * Public key, in hexadecimal, of the key pair that can be used to sign claims against this channel.
   * This can be any valid secp256k1 or Ed25519 public key.
   * This is set by the transaction that created the channel and must match the public key used in claims against the channel.
   * The channel source address can also send XRP from this channel to the destination without signed claims.
   */
  PublicKey: string

  /**
   * Number of seconds the source address must wait to close the channel if it still has any XRP in it.
   * Smaller values mean that the destination address has less time to redeem any outstanding claims
   * after the source address requests to close the channel.
   * Can be any value that fits in a 32-bit unsigned integer (0 to 2^32-1).
   * This is set by the transaction that creates the channel.
   */
  SettleDelay: number

  // Optional Fields
  /**
   * The immutable expiration time for this payment channel, in seconds since the Ripple Epoch.
   * This channel is expired if this value is present and smaller than the previous ledger's close_time field.
   * This is optionally set by the transaction that created the channel and cannot be changed.
   */
  CancelAfter?: number

  /**
   * An arbitrary tag to further specify the destination for this payment channel,
   * such as a hosted recipient at the destination address.
   */
  DestinationTag?: number

  /**
   * A hint indicating which page of the destination's owner directory links to this entry,
   * in case the directory consists of multiple pages.
   * Omitted on payment channels created before enabling the fixPayChanRecipientOwnerDir amendment.
   */
  DestinationNode?: string

  /**
   * The mutable expiration time for this payment channel, in seconds since the Ripple Epoch.
   * The channel is expired if this value is present and smaller than the previous ledger's close_time field.
   * See Channel Expiration for more details.
   */
  Expiration?: number

  /**
   * An arbitrary tag to further specify the source for this payment channel,
   * such as a hosted recipient at the owner's address.
   */
  SourceTag?: number
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
