import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The PayChannel object type represents a payment channel. Payment channels
 * enable small, rapid off-ledger payments of XRP that can be later reconciled
 * with the consensus ledger. A payment channel holds a balance of XRP that can
 * only be paid out to a specific destination address until the channel is
 * closed.
 *
 * @category Ledger Entries
 */
export default interface PayChannel extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'PayChannel'
  /**
   * The source address that owns this payment channel. This comes from the
   * sending address of the transaction that created the channel.
   */
  Account: string
  /**
   * The destination address for this payment channel. While the payment
   * channel is open, this address is the only one that can receive XRP from the
   * channel. This comes from the Destination field of the transaction that
   * created the channel.
   */
  Destination: string
  /**
   * Total XRP, in drops, that has been allocated to this channel. This
   * includes XRP that has been paid to the destination address. This is
   * initially set by the transaction that created the channel and can be
   * increased if the source address sends a PaymentChannelFund transaction.
   */
  Amount: string
  /**
   * Total XRP, in drops, already paid out by the channel. The difference
   * between this value and the Amount field is how much XRP can still be paid
   * to the destination address with PaymentChannelClaim transactions. If the
   * channel closes, the remaining difference is returned to the source address.
   */
  Balance: string
  /**
   * Public key, in hexadecimal, of the key pair that can be used to sign
   * claims against this channel. This can be any valid secp256k1 or Ed25519
   * public key. This is set by the transaction that created the channel and
   * must match the public key used in claims against the channel. The channel
   * source address can also send XRP from this channel to the destination
   * without signed claims.
   */
  PublicKey: string
  /**
   * Number of seconds the source address must wait to close the channel if
   * it still has any XRP in it. Smaller values mean that the destination
   * address has less time to redeem any outstanding claims after the source
   * address requests to close the channel. Can be any value that fits in a
   * 32-bit unsigned integer (0 to 2^32-1). This is set by the transaction that
   * creates the channel.
   */
  SettleDelay: number
  /**
   * A hint indicating which page of the source address's owner directory links
   * to this object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags enabled for this payment channel. Currently,
   * the protocol defines no flags for PayChannel objects.
   */
  Flags: number
  /**
   * The mutable expiration time for this payment channel, in seconds since the
   * Ripple Epoch. The channel is expired if this value is present and smaller
   * than the previous ledger's close_time field. See Setting Channel Expiration
   * for more details.
   */
  Expiration?: number
  /**
   * The immutable expiration time for this payment channel, in seconds since
   * the Ripple Epoch. This channel is expired if this value is present and
   * smaller than the previous ledger's close_time field. This is optionally
   * set by the transaction that created the channel, and cannot be changed.
   */
  CancelAfter?: number
  /**
   * An arbitrary tag to further specify the source for this payment channel
   * useful for specifying a hosted recipient at the owner's address.
   */
  SourceTag?: number
  /**
   * An arbitrary tag to further specify the destination for this payment
   * channel, such as a hosted recipient at the destination address.
   */
  DestinationTag?: number
  /**
   * A hint indicating which page of the destination's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  DestinationNode?: string
}
