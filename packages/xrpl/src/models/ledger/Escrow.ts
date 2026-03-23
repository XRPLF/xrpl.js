import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Escrow object type represents a held payment of XRP waiting to be
 * executed or canceled.
 *
 * @category Ledger Entries
 */
export default interface Escrow extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Escrow'
  /**
   * The address of the owner (sender) of this held payment. This is the
   * account that provided the XRP, and gets it back if the held payment is
   * canceled.
   */
  Account: string
  /**
   * The destination address where the XRP is paid if the held payment is
   * successful.
   */
  Destination: string
  /** The amount to be delivered by the held payment. Can represent XRP, an IOU token, or an MPT.
   * Must always be a positive value. */
  Amount: string
  /**
   * A PREIMAGE-SHA-256 crypto-condition, as hexadecimal. If present, the
   * EscrowFinish transaction must contain a fulfillment that satisfies this
   * condition.
   */
  Condition?: string
  /**
   * The time after which this Escrow is considered expired.
   */
  CancelAfter?: number
  /**
   * The time, in seconds, since the Ripple Epoch, after which this held payment
   * can be finished. Any EscrowFinish transaction before this time fails.
   */
  FinishAfter?: number
  /**
   * A bit-map of boolean flags. No flags are defined for the Escrow type, so
   * this value is always 0.
   */
  Flags: number
  /**
   * An arbitrary tag to further specify the source for this held payment, such
   * as a hosted recipient at the owner's address.
   */
  SourceTag?: number
  /**
   * An arbitrary tag to further specify the destination for this held payment,
   * such as a hosted recipient at the destination address.
   */
  DestinationTag?: number
  /**
   * A hint indicating which page of the owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A hint indicating which page of the destination's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  DestinationNode?: string

  /**
   * The transfer rate or fee at which the funds are escrowed, stored at creation
   *  and used during settlement. Applicable to both IOUs and MPTs.
   */
  TransferRate?: number

  /**
   * The ledger index of the issuer's directory node associated with the Escrow.
   * Used when the issuer is neither the source nor destination account.
   */
  IssuerNode?: number
}
