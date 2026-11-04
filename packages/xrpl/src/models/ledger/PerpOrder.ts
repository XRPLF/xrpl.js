import { Account, XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The PerpOrder object is a resting order in a perpetual futures order book.
 * Number fields are strings.
 *
 * @category Ledger Entries
 */
export default interface PerpOrder extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'PerpOrder'

  /** A bit-map of boolean flags. See {@link PerpOrderFlags}. */
  Flags: number

  /** The owner of the order. */
  Account: Account

  /** The Sequence of the transaction that placed the order. */
  Sequence: number

  /** The ID of the MarginAccount the order trades for. */
  MarginAccountID: string

  /** The ID of the PerpMarket of the order. */
  MarketID: string

  /** The limit price. */
  LimitPrice: XRPLNumber

  /** The remaining size. */
  Size: XRPLNumber

  /** The time after which the order is expired, in seconds since the Ripple Epoch. */
  Expiration?: number

  /** The builder paid on each fill. */
  Builder?: Account

  /** The builder fee rate, in 1/10 basis points. */
  BuilderFee?: number

  /** The book directory page of the order's price level. */
  BookDirectory: string

  /** The page of the book directory that lists this entry. */
  BookNode: string

  /** The page of the owner directory of Account that lists this entry. */
  OwnerNode: string
}

/**
 * Enum representing values of {@link PerpOrder} ledger entry flags.
 *
 * @category Ledger Entry Flags
 */
export enum PerpOrderFlags {
  /** The order is an ask. */
  lsfPerpSell = 0x00010000,
  /** The order only reduces the position. */
  lsfPerpReduceOnly = 0x00020000,
}
