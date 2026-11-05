import { IndexOracle, MarginTier } from '../common'
import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The PerpMarket object is one perpetual futures market of a PerpExchange,
 * for one oracle pair. Rates are in 1/10 basis points; Number fields are
 * strings.
 *
 * @category Ledger Entries
 */
export default interface PerpMarket extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'PerpMarket'

  /** A bit-map of boolean flags. See {@link PerpMarketFlags}. */
  Flags: number

  /** The ID of the PerpExchange the market belongs to. */
  ExchangeID: string

  /** The oracle pair's base currency. */
  BaseAsset: string

  /** The oracle pair's quote currency. */
  QuoteAsset: string

  /** The XLS-47 oracles the index reads. */
  IndexOracles: IndexOracle[]

  /** Ledgers of write freshness. */
  IndexMaxLedgers: number

  /** The price increment. */
  PriceTick: XRPLNumber

  /** The size increment. */
  LotSize: XRPLNumber

  /** The tiers of the margin requirement. */
  MarginTiers: MarginTier[]

  /** The cap on long open interest. */
  OpenInterestMax: XRPLNumber

  /** The share of the index order prices stay within. */
  OrderPriceBand: number

  /**
   * The index price: the price for margin, liquidation, notional, withdrawals
   * and settlement. It is frozen once the market is Settled.
   */
  IndexPrice?: XRPLNumber

  /** The book basis EMA. */
  BasisEMA?: XRPLNumber

  /** The funding rate per 8 hours. */
  FundingRate?: XRPLNumber

  /** Cumulative funding per base unit. */
  CumulativeFunding?: XRPLNumber

  /** The loss index of long positions, per base unit. */
  LossIndexLong?: XRPLNumber

  /** The loss index of short positions, per base unit. */
  LossIndexShort?: XRPLNumber

  /** The sum of long position sizes. */
  OpenInterestLong?: XRPLNumber

  /** The sum of short position sizes. */
  OpenInterestShort?: XRPLNumber

  /** The number of resting orders in the market. */
  OrderCount?: number

  /** The time of the last refresh, in seconds since the Ripple Epoch. */
  LastRefreshTime?: number

  /** The ledger of the last refresh. */
  RefreshLedger?: number

  /**
   * The time MarketStatus last changed, in seconds since the Ripple Epoch;
   * set at creation.
   */
  StatusTime?: number

  /** 0 Live, 1 Stale, 2 Settled. */
  MarketStatus?: number

  /** The page of the exchange owner's owner directory that lists this entry. */
  OwnerNode: string
}

/**
 * Enum representing values of {@link PerpMarket} ledger entry flags.
 *
 * @category Ledger Entry Flags
 */
export enum PerpMarketFlags {
  /**
   * A margin account with a position in this market holds no other position.
   */
  lsfPerpIsolatedOnly = 0x00010000,
}
