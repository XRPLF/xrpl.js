import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The MarginPosition object holds a MarginAccount's position in one
 * PerpMarket. Number fields are strings; a positive Size is long and a
 * negative Size is short.
 *
 * @category Ledger Entries
 */
export default interface MarginPosition
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MarginPosition'

  /** A bit-map of boolean flags. No flags are defined. */
  Flags: number

  /** The ID of the MarginAccount holding the position. */
  MarginAccountID: string

  /** The ID of the PerpMarket of the position. */
  MarketID: string

  /** Signed position size in base units. */
  Size?: XRPLNumber

  /** Signed cost basis of the open part. */
  EntryNotional?: XRPLNumber

  /** The market's CumulativeFunding at the last settlement. */
  FundingIndex?: XRPLNumber

  /** The loss index of this position's side at the last settlement. */
  LossIndex?: XRPLNumber

  /** Resting non-reduce-only buy order size. */
  OpenBuy?: XRPLNumber

  /** Resting non-reduce-only sell order size. */
  OpenSell?: XRPLNumber

  /** Resting orders of every kind. */
  OrderCount?: number

  /** The page of the owner directory of the margin account's Account. */
  OwnerNode: string
}
