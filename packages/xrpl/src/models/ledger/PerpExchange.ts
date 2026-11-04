import { Currency, PendingParameters } from '../common'
import { Account, XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The PerpExchange object is an operator-owned perpetual futures exchange. Its
 * pseudo-account holds all of the exchange's collateral. Rates are in 1/10
 * basis points; Number fields are strings.
 *
 * @category Ledger Entries
 */
export default interface PerpExchange
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'PerpExchange'

  /** A bit-map of boolean flags. No flags are defined. */
  Flags: number

  /** The operator. */
  Owner: Account

  /** The Sequence of the transaction that created the exchange. */
  Sequence: number

  /** The pseudo-account holding all collateral. */
  Account: Account

  /** The collateral asset. */
  Asset: Currency

  /** IOU collateral only: collateral fields are multiples of 10^-Scale. */
  Scale?: number

  /** The Permissioned Domain every trader must be in. */
  DomainID?: string

  /** The backstop Vault bound to this exchange. */
  VaultID?: string

  /** The fee rate charged to a fill's maker. */
  MakerFee?: number

  /** The fee rate charged to a fill's taker. */
  TakerFee?: number

  /** The share of each fee paid to the owner. */
  OwnerFeeShare?: number

  /** The share of each fee paid to the vault. */
  VaultFeeShare?: number

  /** The highest builder fee an order may set. */
  BuilderFeeMax?: number

  /** Cover required per unit of open-interest notional. */
  CoverRateMinimum?: number

  /** The share of the vault's assets the waterfall may draw per window. */
  VaultLossLimit?: number

  /** The vault loss window in seconds; present if and only if VaultID is. */
  VaultLossWindow?: number

  /** Seconds before a loosening change applies. */
  ParameterDelay: number

  /** The pseudo-account's collateral balance. */
  AssetsTotal?: XRPLNumber

  /** Signed; the sum of Cash over the exchange's margin accounts. */
  CashTotal?: XRPLNumber

  /** The fee and penalty share, first in the loss waterfall. */
  InsuranceFund?: XRPLNumber

  /** The owner's first-loss cover. */
  CoverAvailable?: XRPLNumber

  /** The owner's withdrawable fee share. */
  OwnerFees?: XRPLNumber

  /** Signed; collateral held against open positions. */
  SettlementBalance?: XRPLNumber

  /** Shortfall no position could be charged for. */
  BadDebt?: XRPLNumber

  /** The sum over markets of long open interest times the mark price. */
  OpenInterestNotional?: XRPLNumber

  /** The start of the current vault loss window, in seconds. */
  VaultLossWindowStart?: number

  /** The amount drawn from the vault in the current window. */
  VaultLossInWindow?: XRPLNumber

  /** The number of markets of the exchange. */
  MarketCount?: number

  /** The number of margin accounts of the exchange. */
  MarginAccountCount?: number

  /** The queued loosening change. */
  PendingParameters?: PendingParameters

  /** The time, in seconds since the Ripple Epoch, the queued change applies. */
  ParameterEffectiveTime?: number

  /** Operator metadata, hex-encoded. */
  Data?: string

  /** The page of the owner directory of Owner that lists this entry. */
  OwnerNode: string
}
