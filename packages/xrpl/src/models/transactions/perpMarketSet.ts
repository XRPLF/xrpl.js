import { ValidationError } from '../../errors'
import { IndexOracle, MarginTier } from '../common'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isArray,
  isLedgerEntryId,
  isNumber,
  isRecord,
  isString,
  isXRPLNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  XRPLNumber,
} from './common'

/** The most oracles a market's index reads (rippled `kMaxPerpOracles`). */
const MAX_INDEX_ORACLES = 5

/** The most tiers of a market's margin requirement (rippled `kMaxMarginTiers`). */
const MAX_MARGIN_TIERS = 3

/** Fields that only a market's creation may carry. */
const CREATION_ONLY_FIELDS = [
  'ExchangeID',
  'BaseAsset',
  'QuoteAsset',
  'PriceTick',
  'LotSize',
]

/**
 * Enum representing values of {@link PerpMarketSet} transaction flags.
 *
 * @category Transaction Flags
 */
export enum PerpMarketSetFlags {
  /** Update only: settle a Live market at its current mark. */
  tfPerpMarketSettle = 0x00010000,
  /**
   * Creation only: a margin account with a position in the market holds no
   * other position.
   */
  tfPerpIsolatedOnly = 0x00020000,
}

/**
 * Map of flags to boolean values representing {@link PerpMarketSet}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface PerpMarketSetFlagsInterface extends GlobalFlagsInterface {
  tfPerpMarketSettle?: boolean
  tfPerpIsolatedOnly?: boolean
}

/**
 * The PerpMarketSet transaction creates a perpetual futures market on an
 * exchange, or updates or settles one. Creation carries ExchangeID and every
 * required parameter; an update carries MarketID and the parameters to change.
 *
 * @category Transaction Models
 */
export interface PerpMarketSet extends BaseTransaction {
  TransactionType: 'PerpMarketSet'

  /** Creation only, and required there: the PerpExchange that lists the market. */
  ExchangeID?: string

  /** Update only: the ID of the PerpMarket ledger entry to change. */
  MarketID?: string

  /** Creation only, and required there: the oracle pair's base currency. */
  BaseAsset?: string

  /** Creation only, and required there: the oracle pair's quote currency. */
  QuoteAsset?: string

  /** Required on creation: 1 to 5 distinct XLS-47 oracles the index reads. */
  IndexOracles?: IndexOracle[]

  /** Required on creation: seconds of provider-timestamp freshness. */
  IndexMaxAge?: number

  /** Required on creation: ledgers of write freshness. */
  IndexMaxLedgers?: number

  /** Creation only, and required there: the price increment. */
  PriceTick?: XRPLNumber

  /** Creation only, and required there: the size increment. */
  LotSize?: XRPLNumber

  /** Required on creation: 1 to 3 tiers of the margin requirement. */
  MarginTiers?: MarginTier[]

  /** Required on creation: the cap on long open interest. */
  OpenInterestMax?: XRPLNumber

  /** Required on creation: the share of the index order prices stay within. */
  OrderPriceBand?: number

  /** Required on creation: the widest spread whose mid feeds the mark. */
  MidSpreadMax?: number

  /** Required on creation: the band around the index the mark is clamped to. */
  MarkBand?: number

  /** Required on creation: the largest move of the mark per refresh. */
  MarkMoveMax?: number

  /** Required on creation: seconds of the book basis EMA window. */
  BasisWindow?: number

  /** The signed funding interest rate per 8 hours, in 1/10 basis points. */
  FundingInterestRate?: number

  /** Required on creation: the funding rate cap per 8 hours. */
  FundingCap?: number

  /** Required on creation: the penalty rate on liquidated notional. */
  LiquidationPenalty?: number

  /** Required on creation: the share of the penalty paid to the liquidator. */
  LiquidationRewardShare?: number

  /** The reward paid from the insurance fund when the penalty is zero. */
  LiquidationRewardMin?: XRPLNumber

  /** Required on creation: the notional above which a liquidation is partial. */
  LiquidationChunkMin?: XRPLNumber

  /** Required on creation: seconds stale before anyone may settle the market. */
  SettleStaleAfter?: number

  Flags?: number | PerpMarketSetFlagsInterface
}

/**
 * Whether the input is an array of 1 to 5 well-formed IndexOracle objects.
 *
 * @param input - The value to check.
 * @returns Whether the input is a valid IndexOracles array.
 */
function isIndexOracles(input: unknown): input is IndexOracle[] {
  return (
    isArray(input) &&
    input.length >= 1 &&
    input.length <= MAX_INDEX_ORACLES &&
    input.every(
      (entry) =>
        isRecord(entry) &&
        isRecord(entry.IndexOracle) &&
        isAccount(entry.IndexOracle.Owner) &&
        isNumber(entry.IndexOracle.OracleDocumentID),
    )
  )
}

/**
 * Whether the input is an array of 1 to 3 well-formed MarginTier objects.
 *
 * @param input - The value to check.
 * @returns Whether the input is a valid MarginTiers array.
 */
function isMarginTiers(input: unknown): input is MarginTier[] {
  return (
    isArray(input) &&
    input.length >= 1 &&
    input.length <= MAX_MARGIN_TIERS &&
    input.every(
      (entry) =>
        isRecord(entry) &&
        isRecord(entry.MarginTier) &&
        isXRPLNumber(entry.MarginTier.NotionalMax) &&
        isNumber(entry.MarginTier.InitialMarginRate) &&
        isNumber(entry.MarginTier.MaintenanceMarginRate),
    )
  )
}

/** Every field of a PerpMarketSet with its type check, in macro order. */
const FIELD_CHECKS: Array<[string, (input: unknown) => input is unknown]> = [
  ['ExchangeID', isLedgerEntryId],
  ['MarketID', isLedgerEntryId],
  ['BaseAsset', isString],
  ['QuoteAsset', isString],
  ['IndexOracles', isIndexOracles],
  ['IndexMaxAge', isNumber],
  ['IndexMaxLedgers', isNumber],
  ['PriceTick', isXRPLNumber],
  ['LotSize', isXRPLNumber],
  ['MarginTiers', isMarginTiers],
  ['OpenInterestMax', isXRPLNumber],
  ['OrderPriceBand', isNumber],
  ['MidSpreadMax', isNumber],
  ['MarkBand', isNumber],
  ['MarkMoveMax', isNumber],
  ['BasisWindow', isNumber],
  ['FundingInterestRate', isNumber],
  ['FundingCap', isNumber],
  ['LiquidationPenalty', isNumber],
  ['LiquidationRewardShare', isNumber],
  ['LiquidationRewardMin', isXRPLNumber],
  ['LiquidationChunkMin', isXRPLNumber],
  ['SettleStaleAfter', isNumber],
]

/** Fields a creation must carry; the others of FIELD_CHECKS are optional. */
const REQUIRED_ON_CREATION = new Set([
  'ExchangeID',
  'BaseAsset',
  'QuoteAsset',
  'IndexOracles',
  'IndexMaxAge',
  'IndexMaxLedgers',
  'PriceTick',
  'LotSize',
  'MarginTiers',
  'OpenInterestMax',
  'OrderPriceBand',
  'MidSpreadMax',
  'MarkBand',
  'MarkMoveMax',
  'BasisWindow',
  'FundingCap',
  'LiquidationPenalty',
  'LiquidationRewardShare',
  'LiquidationChunkMin',
  'SettleStaleAfter',
])

/**
 * Verify the form and type of a {@link PerpMarketSet} at runtime.
 *
 * @param tx - A {@link PerpMarketSet} Transaction.
 * @throws When the {@link PerpMarketSet} is malformed.
 */
export function validatePerpMarketSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  FIELD_CHECKS.forEach(([field, check]) =>
    validateOptionalField(tx, field, check),
  )

  if (tx.MarketID !== undefined) {
    const fixed = CREATION_ONLY_FIELDS.find((field) => tx[field] !== undefined)
    if (fixed !== undefined) {
      throw new ValidationError(
        `PerpMarketSet: ${fixed} can only be set on creation`,
      )
    }
    if (
      hasFlag(tx, PerpMarketSetFlags.tfPerpIsolatedOnly, 'tfPerpIsolatedOnly')
    ) {
      throw new ValidationError(
        'PerpMarketSet: tfPerpIsolatedOnly is only valid on creation',
      )
    }
    return
  }

  FIELD_CHECKS.filter(([field]) => REQUIRED_ON_CREATION.has(field)).forEach(
    ([field, check]) => validateRequiredField(tx, field, check),
  )
  if (
    hasFlag(tx, PerpMarketSetFlags.tfPerpMarketSettle, 'tfPerpMarketSettle')
  ) {
    throw new ValidationError(
      'PerpMarketSet: tfPerpMarketSettle is only valid on an update',
    )
  }
}
