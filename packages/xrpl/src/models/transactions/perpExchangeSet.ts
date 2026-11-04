import { ValidationError } from '../../errors'
import { Currency } from '../common'

import {
  BaseTransaction,
  isCurrency,
  isDomainID,
  isLedgerEntryId,
  isNumber,
  isXRPLNumber,
  validateBaseTransaction,
  validateFormatFields,
  validateHexMetadata,
  validateOptionalField,
  validateRequiredField,
  XRPLNumber,
} from './common'

/** The largest Data payload, in bytes (rippled `kMaxDataPayloadLength`). */
const PERP_EXCHANGE_DATA_MAX_BYTE_LENGTH = 256

/** The unit of a rate share, in 1/10 basis points. */
const RATE_UNITY = 100000

/** Fields that only an exchange's creation may carry. */
const CREATION_ONLY_FIELDS = [
  'Asset',
  'Scale',
  'DomainID',
  'LiquidationRewardMin',
  'LiquidationChunkMin',
]

/**
 * The PerpExchangeSet transaction creates a perpetual futures exchange with
 * its collateral pseudo-account, or updates the mutable parameters of one.
 * Creation omits ExchangeID; an update carries it.
 *
 * @category Transaction Models
 */
export interface PerpExchangeSet extends BaseTransaction {
  TransactionType: 'PerpExchangeSet'

  /** Update only: the ID of the PerpExchange ledger entry to change. */
  ExchangeID?: string

  /** Creation only, and required there: the collateral asset. */
  Asset?: Currency

  /** Creation only, IOU collateral only: the collateral scale. */
  Scale?: number

  /** Creation only: the Permissioned Domain every trader must be in. */
  DomainID?: string

  /** The fee rate charged to a fill's maker, in 1/10 basis points. */
  MakerFee?: number

  /** The fee rate charged to a fill's taker, in 1/10 basis points. */
  TakerFee?: number

  /**
   * The share of each fee paid to the owner, in 1/10 basis points, at most
   * 100000; the rest goes to the insurance fund.
   */
  OwnerFeeShare?: number

  /** The highest builder fee an order may set, in 1/10 basis points. */
  BuilderFeeMax?: number

  /** Cover required per unit of open-interest notional, in 1/10 basis points. */
  CoverRateMinimum?: number

  /**
   * Required on creation: the penalty rate on liquidated notional, in 1/10
   * basis points.
   */
  LiquidationPenalty?: number

  /**
   * Creation only: the reward paid to a liquidator from the insurance fund
   * when the penalty is zero, as a Number string.
   */
  LiquidationRewardMin?: XRPLNumber

  /**
   * Creation only, and required there: the notional above which a
   * liquidation is partial, as a Number string.
   */
  LiquidationChunkMin?: XRPLNumber

  /** Operator metadata, hex-encoded, at most 256 bytes. */
  Data?: string
}

/**
 * Whether the input is a non-empty, even-length hex string of at most 256 bytes.
 *
 * @param input - The value to check.
 * @returns Whether the input is valid exchange Data.
 */
function isPerpExchangeData(input: unknown): input is string {
  return (
    validateHexMetadata(input, PERP_EXCHANGE_DATA_MAX_BYTE_LENGTH * 2) &&
    input.length % 2 === 0
  )
}

/** Every field of a PerpExchangeSet with its type check, in macro order. */
const FIELD_CHECKS: Array<[string, (input: unknown) => input is unknown]> = [
  ['ExchangeID', isLedgerEntryId],
  ['Asset', isCurrency],
  ['Scale', isNumber],
  ['DomainID', isDomainID],
  ['MakerFee', isNumber],
  ['TakerFee', isNumber],
  ['OwnerFeeShare', isNumber],
  ['BuilderFeeMax', isNumber],
  ['CoverRateMinimum', isNumber],
  ['LiquidationPenalty', isNumber],
  ['LiquidationRewardMin', isXRPLNumber],
  ['LiquidationChunkMin', isXRPLNumber],
  ['Data', isPerpExchangeData],
]

/**
 * Verify the form and type of a {@link PerpExchangeSet} at runtime.
 *
 * @param tx - A {@link PerpExchangeSet} Transaction.
 * @throws When the {@link PerpExchangeSet} is malformed.
 */
export function validatePerpExchangeSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFormatFields(
    tx,
    'PerpExchangeSet',
    FIELD_CHECKS.map(([field]) => field),
  )
  FIELD_CHECKS.forEach(([field, check]) =>
    validateOptionalField(tx, field, check),
  )

  if (isNumber(tx.OwnerFeeShare) && tx.OwnerFeeShare > RATE_UNITY) {
    throw new ValidationError(
      `PerpExchangeSet: OwnerFeeShare must not exceed ${RATE_UNITY}`,
    )
  }

  if (tx.ExchangeID !== undefined) {
    const fixed = CREATION_ONLY_FIELDS.find((field) => tx[field] !== undefined)
    if (fixed !== undefined) {
      throw new ValidationError(
        `PerpExchangeSet: ${fixed} can only be set on creation`,
      )
    }
    return
  }

  validateRequiredField(tx, 'Asset', isCurrency)
  validateRequiredField(tx, 'LiquidationPenalty', isNumber)
  validateRequiredField(tx, 'LiquidationChunkMin', isXRPLNumber)
}
