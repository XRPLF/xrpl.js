import { Amount, MPTAmount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Enum for Subscription ledger entry flags.
 *
 * @category Ledger Entry Flags
 */
export enum SubscriptionFlags {
  /**
   * The Subscription is deleted on its first successful claim.
   */
  lsfSingleUse = 0x00010000,
}

/**
 * The Subscription object type lets its Destination claim up to Amount from
 * the Account every Frequency seconds.
 *
 * @category Ledger Entries
 */
export default interface Subscription
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Subscription'
  /**
   * The sequence number of the SubscriptionSet transaction that created this
   * object.
   */
  Sequence: number
  /**
   * The account that pays the Subscription and owns this object.
   */
  Account: string
  /**
   * The account that may claim from the Subscription.
   */
  Destination: string
  /**
   * The destination tag of the Destination.
   */
  DestinationTag?: number
  /**
   * The most the Destination may claim per period (XRP, IOU or MPT).
   */
  Amount: Amount | MPTAmount
  /**
   * The amount still claimable in the current period.
   */
  Balance: Amount | MPTAmount
  /**
   * The length of a claim period, in seconds; 0 means the Subscription is
   * unmetered.
   */
  Frequency: number
  /**
   * The time, in seconds since the Ripple Epoch, at which the current claim
   * period starts.
   */
  NextClaimTime: number
  /**
   * The time, in seconds since the Ripple Epoch, after which the Subscription
   * can no longer be claimed.
   */
  Expiration?: number
  /**
   * A hint indicating which page of the Account's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A hint indicating which page of the Destination's owner directory links
   * to this object, in case the directory consists of multiple pages.
   */
  DestinationNode: string
  /**
   * A bit-map of boolean flags. See {@link SubscriptionFlags}.
   */
  Flags: number
}
