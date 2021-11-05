import { Amount } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * A Check object describes a check, similar to a paper personal check, which
 * can be cashed by its destination to get money from its sender.
 *
 * @category Ledger Entries
 */
export default interface Check extends BaseLedgerEntry {
  LedgerEntryType: 'Check'
  /** The sender of the Check. Cashing the Check debits this address's balance. */
  Account: string
  /**
   * The intended recipient of the Check. Only this address can cash the Check,
   * using a CheckCash transaction.
   */
  Destination: string
  /**
   * A bit-map of boolean flags. No flags are defined for Checks, so this value
   * is always 0.
   */
  Flags: 0
  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * The identifying hash of the transaction that most recently modified this
   * object.
   */
  PreviousTxnID: string
  /**
   * The index of the ledger that contains the transaction that most recently
   * modified this object.
   */
  PreviousTxnLgrSeq: number
  /**
   * The maximum amount of currency this Check can debit the sender. If the
   * Check is successfully cashed, the destination is credited in the same
   * currency for up to this amount.
   */
  SendMax: Amount
  /** The sequence number of the CheckCreate transaction that created this check. */
  Sequence: number
  /**
   * A hint indicating which page of the destination's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  DestinationNode?: string
  /**
   * An arbitrary tag to further specify the destination for this Check, such
   * as a hosted recipient at the destination address.
   */
  DestinationTag?: number
  /** Indicates the time after which this Check is considered expired. */
  Expiration?: number
  /**
   * Arbitrary 256-bit hash provided by the sender as a specific reason or
   * identifier for this Check.
   */
  InvoiceID?: string
  /**
   * An arbitrary tag to further specify the source for this Check, such as a
   * hosted recipient at the sender's address.
   */
  SourceTag?: number
}
