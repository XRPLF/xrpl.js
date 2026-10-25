import { Amount, MPTAmount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Repo object is a bilateral repurchase agreement. The seller (Account)
 * locks collateral and receives cash; the entry is pending until the
 * Counterparty accepts it and active thereafter.
 *
 * @category Ledger Entries
 */
export default interface Repo extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Repo'

  /** A bit-map of boolean flags. */
  Flags: number

  /** The seller, who locked the collateral. */
  Account: string

  /** The buyer, who pays the PurchasePrice. */
  Counterparty: string

  /** The locked collateral. */
  CollateralAmount: Amount | MPTAmount

  /** The cash the buyer pays on accept. */
  PurchasePrice: Amount | MPTAmount

  /** The interest rate in 1/10 basis points. */
  InterestRate: number

  /**
   * The time, in seconds since the Ripple Epoch, after which the offer can no
   * longer be accepted.
   */
  Expiration: number

  /**
   * The time, in seconds since the Ripple Epoch, the cash was paid. Present
   * once the repo is active; interest runs from it.
   */
  StartDate?: number

  /** The time, in seconds since the Ripple Epoch, the repurchase is due. */
  MaturityDate: number

  /** Seconds after MaturityDate during which the seller may still repurchase. */
  GracePeriod: number

  /**
   * The collateral issuer's transfer rate captured at create, when it is not
   * parity.
   */
  TransferRate?: number

  /** A reference to the governing legal annex, in hex. */
  Data?: string

  /** The page of the seller's owner directory that references this entry. */
  OwnerNode: string

  /** The page of the Counterparty's owner directory that references this entry. */
  DestinationNode: string

  /**
   * The page of the IOU collateral issuer's owner directory that references
   * this entry. Present only for IOU collateral.
   */
  IssuerNode?: string

  /** The account sponsoring the reserve for this entry. */
  Sponsor?: string
}
