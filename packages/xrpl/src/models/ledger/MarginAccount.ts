import { Account, XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The MarginAccount object holds one account's cross-margined collateral on a
 * PerpExchange; an account has at most one per exchange. Number fields are
 * strings.
 *
 * @category Ledger Entries
 */
export default interface MarginAccount
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MarginAccount'

  /** A bit-map of boolean flags. No flags are defined. */
  Flags: number

  /** The owner of the margin account. */
  Account: Account

  /** The ID of the PerpExchange the collateral is held on. */
  ExchangeID: string

  /** Signed; deposited collateral plus realised PnL, funding, fees and losses. */
  Cash?: XRPLNumber

  /** Waterfall payments received and not yet repaid. */
  WaterfallCredit?: XRPLNumber

  /** The market IDs of this account's MarginPosition entries. */
  Markets?: string[]

  /** The page of the owner directory of Account that lists this entry. */
  OwnerNode: string
}
