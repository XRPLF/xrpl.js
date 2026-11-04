import { IndexOracle, MarginTier, PendingParameters } from '../common'
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

  /** Seconds of provider-timestamp freshness. */
  IndexMaxAge: number

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

  /** The widest spread whose mid feeds the mark. */
  MidSpreadMax: number

  /** The band around the index the mark is clamped to. */
  MarkBand: number

  /** The largest move of the mark per refresh. */
  MarkMoveMax: number

  /** Seconds of the book basis EMA window. */
  BasisWindow: number

  /** The signed funding interest rate per 8 hours. */
  FundingInterestRate?: number

  /** The funding rate cap per 8 hours. */
  FundingCap: number

  /** The penalty rate on liquidated notional. */
  LiquidationPenalty: number

  /** The share of the penalty paid to the liquidator. */
  LiquidationRewardShare: number

  /** The reward paid from the insurance fund when the penalty is zero. */
  LiquidationRewardMin?: XRPLNumber

  /** The notional above which a liquidation is partial. */
  LiquidationChunkMin: XRPLNumber

  /** Seconds stale before anyone may settle the market. */
  SettleStaleAfter: number

  /** The index price. */
  IndexPrice?: XRPLNumber

  /** The mark price. */
  MarkPrice?: XRPLNumber

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

  /** The time the market became Stale, in seconds since the Ripple Epoch. */
  StaleSince?: number

  /** The time the market was Settled, in seconds since the Ripple Epoch. */
  SettledAt?: number

  /** 0 Live, 1 Stale, 2 Settled. */
  MarketStatus?: number

  /** The price the market was settled at. */
  SettlementPrice?: XRPLNumber

  /** The queued loosening change. */
  PendingParameters?: PendingParameters

  /** The time, in seconds since the Ripple Epoch, the queued change applies. */
  ParameterEffectiveTime?: number

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
