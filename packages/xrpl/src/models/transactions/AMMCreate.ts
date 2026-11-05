import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

export const AMM_MAX_TRADING_FEE = 1000

/**
 * (AMMCurves) The bonding curve of an AMM instance, set by `CurveType`.
 * An AMM is identified by its asset pair and its curve type.
 */
export enum AMMCurveType {
  /** The constant-product curve. The default when `CurveType` is omitted. */
  constantProduct = 0,
  /** Concentrated liquidity: each position provides liquidity over a tick range. */
  concentratedLiquidity = 1,
  /** StableSwap: a curve flattened by an amplification coefficient. */
  stableSwap = 2,
  /** Binned: liquidity is held in bins, each at a fixed price. */
  binned = 3,
}

/**
 * (AMMCurves) Fee tier of a concentrated liquidity AMM, set by `FeeTier`.
 * The tier fixes the trading fee and the tick spacing of the pool.
 */
export enum AMMFeeTier {
  /** 1 basis point fee, tick spacing 1. */
  stable = 0,
  /** 5 basis points fee, tick spacing 10. */
  low = 1,
  /** 30 basis points fee, tick spacing 60. */
  medium = 2,
  /** 100 basis points fee, tick spacing 200. */
  high = 3,
}

/** (AMMCurves) Lowest tick of a concentrated liquidity AMM. */
export const AMM_MIN_TICK = -887272

/** (AMMCurves) Highest tick of a concentrated liquidity AMM. */
export const AMM_MAX_TICK = 887272

/** (AMMCurves) Lowest bin ID of a binned AMM. */
export const AMM_MIN_BIN_ID = -221818

/** (AMMCurves) Highest bin ID of a binned AMM. */
export const AMM_MAX_BIN_ID = 221818

/** (AMMCurves) Lowest amplification coefficient of a StableSwap AMM. */
export const AMM_MIN_AMPLIFICATION = 1

/** (AMMCurves) Highest amplification coefficient of a StableSwap AMM. */
export const AMM_MAX_AMPLIFICATION = 5000

/**
 * (AMMCurves) Bin widths, in basis points, a binned AMM may use as `BinStep`.
 */
export enum AMMBinStep {
  oneBasisPoint = 1,
  fiveBasisPoints = 5,
  tenBasisPoints = 10,
  twentyFiveBasisPoints = 25,
  oneHundredBasisPoints = 100,
}

const AMM_BIN_STEPS = Object.values(AMMBinStep).filter(
  (value): value is number => typeof value === 'number',
)

/**
 * Check that a bin ID lies within the bin range of a binned AMM.
 *
 * @param binID - The bin ID to check.
 * @returns Whether `binID` is between {@link AMM_MIN_BIN_ID} and {@link AMM_MAX_BIN_ID}.
 */
export function isAMMBinIDInRange(binID: number): boolean {
  return binID >= AMM_MIN_BIN_ID && binID <= AMM_MAX_BIN_ID
}

/**
 * Check that an amplification coefficient lies within the StableSwap range.
 *
 * @param amplification - The amplification coefficient to check.
 * @returns Whether `amplification` is between {@link AMM_MIN_AMPLIFICATION} and {@link AMM_MAX_AMPLIFICATION}.
 */
export function isAMMAmplificationInRange(amplification: number): boolean {
  return (
    amplification >= AMM_MIN_AMPLIFICATION &&
    amplification <= AMM_MAX_AMPLIFICATION
  )
}

/**
 * Create a new Automated Market Maker (AMM) instance for trading a pair of assets (fungible tokens or XRP).
 *
 * Creates both an AMM object and a special AccountRoot object to represent the AMM.
 * Also transfers ownership of the starting balance of both assets from the sender to the created AccountRoot
 * and issues an initial balance of liquidity provider tokens (LP Tokens) from the AMM account to the sender.
 *
 * CAUTION: When you create the AMM, you should fund it with (approximately) equal-value amounts of each asset.
 * Otherwise, other users can profit at your expense by trading with this AMM (performing arbitrage).
 * The currency risk that liquidity providers take on increases with the volatility (potential for imbalance) of the asset pair.
 * The higher the trading fee, the more it offsets this risk,
 * so it's best to set the trading fee based on the volatility of the asset pair.
 */
export interface AMMCreate extends BaseTransaction {
  TransactionType: 'AMMCreate'

  /**
   * The first of the two assets to fund this AMM with. This must be a positive amount.
   */
  Amount: Amount

  /**
   * The second of the two assets to fund this AMM with. This must be a positive amount.
   */
  Amount2: Amount

  /**
   * The fee to charge for trades against this AMM instance, in units of 1/100,000; a value of 1 is equivalent to 0.001%.
   * The maximum value is 1000, indicating a 1% fee.
   * The minimum value is 0.
   */
  TradingFee: number

  /**
   * (AMMCurves) The bonding curve of the AMM, one of {@link AMMCurveType}.
   * Defaults to the constant-product curve (0).
   */
  CurveType?: number

  /**
   * (AMMCurves) The fee tier of a concentrated liquidity AMM, one of {@link AMMFeeTier}.
   * Required when `CurveType` is 1.
   */
  FeeTier?: number

  /**
   * (AMMCurves) The amplification coefficient of a StableSwap AMM, from 1 to 5000.
   * Required when `CurveType` is 2.
   */
  Amplification?: number

  /**
   * (AMMCurves) The bin width of a binned AMM in basis points, one of {@link AMMBinStep}.
   * The price of bin `id` is `(1 + BinStep / 10000) ^ id`. Required when `CurveType` is 3.
   */
  BinStep?: number
}

interface AMMCreateCurveFields {
  CurveType?: number
  FeeTier?: number
  Amplification?: number
  BinStep?: number
}

/**
 * Verify the form and type of an AMMCreate at runtime.
 *
 * @param tx - An AMMCreate Transaction.
 * @throws When the AMMCreate is Malformed.
 */
export function validateAMMCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Amount', isAmount)

  validateRequiredField(tx, 'Amount2', isAmount)

  validateRequiredField(tx, 'TradingFee', isNumber)

  if (tx.TradingFee < 0 || tx.TradingFee > AMM_MAX_TRADING_FEE) {
    throw new ValidationError(
      `AMMCreate: TradingFee must be between 0 and ${AMM_MAX_TRADING_FEE}`,
    )
  }

  validateOptionalField(tx, 'CurveType', isNumber)
  validateOptionalField(tx, 'FeeTier', isNumber)
  validateOptionalField(tx, 'Amplification', isNumber)
  validateOptionalField(tx, 'BinStep', isNumber)
  validateCurveFields(tx)
}

/**
 * Check `CurveType` and the curve parameter that the curve type requires.
 *
 * @param tx - An AMMCreate Transaction.
 * @throws When `CurveType` is unknown or its curve parameter is missing or out of range.
 */
function validateCurveFields(tx: AMMCreateCurveFields): void {
  if (tx.CurveType === undefined) {
    return
  }
  if (
    tx.CurveType < AMMCurveType.constantProduct ||
    tx.CurveType > AMMCurveType.binned
  ) {
    throw new ValidationError(
      `AMMCreate: CurveType must be between ${AMMCurveType.constantProduct} and ${AMMCurveType.binned}`,
    )
  }
  if (tx.CurveType === AMMCurveType.concentratedLiquidity) {
    validateFeeTier(tx.FeeTier)
  } else if (tx.CurveType === AMMCurveType.stableSwap) {
    validateAmplification(tx.Amplification)
  } else if (tx.CurveType === AMMCurveType.binned) {
    validateBinStep(tx.BinStep)
  }
}

/**
 * Check the fee tier of a concentrated liquidity AMMCreate.
 *
 * @param feeTier - The `FeeTier` field.
 * @throws When `FeeTier` is missing or is not an {@link AMMFeeTier}.
 */
function validateFeeTier(feeTier: number | undefined): void {
  if (feeTier === undefined) {
    throw new ValidationError(
      `AMMCreate: FeeTier is required when CurveType is ${AMMCurveType.concentratedLiquidity}`,
    )
  }
  if (feeTier < AMMFeeTier.stable || feeTier > AMMFeeTier.high) {
    throw new ValidationError(
      `AMMCreate: FeeTier must be between ${AMMFeeTier.stable} and ${AMMFeeTier.high}`,
    )
  }
}

/**
 * Check the amplification coefficient of a StableSwap AMMCreate.
 *
 * @param amplification - The `Amplification` field.
 * @throws When `Amplification` is missing or out of range.
 */
function validateAmplification(amplification: number | undefined): void {
  if (amplification === undefined) {
    throw new ValidationError(
      `AMMCreate: Amplification is required when CurveType is ${AMMCurveType.stableSwap}`,
    )
  }
  if (!isAMMAmplificationInRange(amplification)) {
    throw new ValidationError(
      `AMMCreate: Amplification must be between ${AMM_MIN_AMPLIFICATION} and ${AMM_MAX_AMPLIFICATION}`,
    )
  }
}

/**
 * Check the bin width of a binned AMMCreate.
 *
 * @param binStep - The `BinStep` field.
 * @throws When `BinStep` is missing or is not an {@link AMMBinStep}.
 */
function validateBinStep(binStep: number | undefined): void {
  if (binStep === undefined) {
    throw new ValidationError(
      `AMMCreate: BinStep is required when CurveType is ${AMMCurveType.binned}`,
    )
  }
  if (!AMM_BIN_STEPS.includes(binStep)) {
    throw new ValidationError(
      `AMMCreate: BinStep must be one of ${AMM_BIN_STEPS.join(', ')}`,
    )
  }
}
