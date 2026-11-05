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
  'IndexOracles',
  'IndexMaxLedgers',
  'PriceTick',
  'LotSize',
]

/**
 * Enum representing values of {@link PerpMarketSet} transaction flags.
 *
 * @category Transaction Flags
 */
export enum PerpMarketSetFlags {
  /** Update only: settle a Live market at its current index. */
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
 * parameter; an update carries MarketID and the tighten-only parameters to
 * change.
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

  /**
   * Creation only, and required there: 1 to 5 distinct XLS-47 oracles the
   * index reads.
   */
  IndexOracles?: IndexOracle[]

  /** Creation only, and required there: ledgers of write freshness. */
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
  ['IndexMaxLedgers', isNumber],
  ['PriceTick', isXRPLNumber],
  ['LotSize', isXRPLNumber],
  ['MarginTiers', isMarginTiers],
  ['OpenInterestMax', isXRPLNumber],
  ['OrderPriceBand', isNumber],
]

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

  FIELD_CHECKS.filter(([field]) => field !== 'MarketID').forEach(
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
