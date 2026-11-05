import { ValidationError } from '../../errors'
import { Amount, Currency, IssuedCurrencyAmount } from '../common'
import { hasFlag } from '../utils'

import {
  AMM_MAX_BIN_ID,
  AMM_MAX_TICK,
  AMM_MIN_BIN_ID,
  AMM_MIN_TICK,
  AMMCurveType,
  isAMMBinIDInRange,
} from './AMMCreate'
import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAmount,
  isIssuedCurrency,
  isIssuedCurrencyAmount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values for AMMDeposit Transaction Flags.
 *
 * @category Transaction Flags
 */
export enum AMMDepositFlags {
  tfLPToken = 0x00010000,
  tfSingleAsset = 0x00080000,
  tfTwoAsset = 0x00100000,
  tfOneAssetLPToken = 0x00200000,
  tfLimitLPToken = 0x00400000,
  tfTwoAssetIfEmpty = 0x00800000,
}

export interface AMMDepositFlagsInterface extends GlobalFlagsInterface {
  tfLPToken?: boolean
  tfSingleAsset?: boolean
  tfTwoAsset?: boolean
  tfOneAssetLPToken?: boolean
  tfLimitLPToken?: boolean
  tfTwoAssetIfEmpty?: boolean
}

/**
 * Deposit funds into an Automated Market Maker (AMM) instance
 * and receive the AMM's liquidity provider tokens (LP Tokens) in exchange.
 *
 * You can deposit one or both of the assets in the AMM's pool.
 * If successful, this transaction creates a trust line to the AMM Account (limit 0) to hold the LP Tokens.
 */
export interface AMMDeposit extends BaseTransaction {
  TransactionType: 'AMMDeposit'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The amount of one asset to deposit to the AMM.
   * If present, this must match the type of one of the assets (tokens or XRP) in the AMM's pool.
   */
  Amount?: Amount

  /**
   * The amount of another asset to add to the AMM.
   * If present, this must match the type of the other asset in the AMM's pool and cannot be the same asset as Amount.
   */
  Amount2?: Amount

  /**
   * The maximum effective price, in the deposit asset, to pay for each LP Token received.
   */
  EPrice?: Amount

  /**
   * How many of the AMM's LP Tokens to buy.
   */
  LPTokenOut?: IssuedCurrencyAmount

  /**
   * (AMMCurves) The curve type of the AMM to deposit into, one of {@link AMMCurveType}.
   * Defaults to the constant-product curve (0).
   */
  CurveType?: number

  /**
   * (AMMCurves) The lower tick of the new concentrated liquidity position, from -887272.
   * Required, with `TickUpper`, when `CurveType` is 1.
   */
  TickLower?: number

  /**
   * (AMMCurves) The upper tick of the new concentrated liquidity position, up to 887272.
   * Must be greater than `TickLower`. Required, with `TickLower`, when `CurveType` is 1.
   */
  TickUpper?: number

  /**
   * (AMMCurves) The bin of a binned AMM to deposit into, from -221818 to 221818.
   * Required when `CurveType` is 3.
   */
  BinID?: number
}

interface AMMDepositCurveFields extends Record<string, unknown> {
  CurveType?: number
  TickLower?: number
  TickUpper?: number
  BinID?: number
}

/**
 * Verify the form and type of an AMMDeposit at runtime.
 *
 * @param tx - An AMMDeposit Transaction.
 * @throws When the AMMDeposit is Malformed.
 */
export function validateAMMDeposit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isIssuedCurrency)

  validateRequiredField(tx, 'Asset2', isIssuedCurrency)

  if (tx.Amount2 != null && tx.Amount == null) {
    throw new ValidationError('AMMDeposit: must set Amount with Amount2')
  } else if (tx.EPrice != null && tx.Amount == null) {
    throw new ValidationError('AMMDeposit: must set Amount with EPrice')
  } else if (tx.LPTokenOut == null && tx.Amount == null) {
    throw new ValidationError(
      'AMMDeposit: must set at least LPTokenOut or Amount',
    )
  }

  validateOptionalField(tx, 'LPTokenOut', isIssuedCurrencyAmount)
  validateOptionalField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Amount2', isAmount)
  validateOptionalField(tx, 'EPrice', isAmount)

  validateCurveFields(tx)
}

/**
 * Sum the AMMDeposit mode flags (the {@link AMMDepositFlags}) set on a transaction.
 *
 * @param tx - An AMMDeposit Transaction.
 * @returns The mode flags set on `tx`, as a number.
 */
function getDepositModeFlags(tx: Record<string, unknown>): number {
  return Object.entries(AMMDepositFlags).reduce((flags, [name, value]) => {
    if (typeof value === 'number' && hasFlag(tx, value, name)) {
      return flags + value
    }
    return flags
  }, 0)
}

/**
 * Check the tick and bin fields of an AMMDeposit against its `CurveType`.
 *
 * @param tx - An AMMDeposit Transaction.
 * @throws When a curve field has the wrong type, a field the curve type requires
 * is missing or out of range, or a field the curve type does not use is present.
 */
function validateCurveFields(tx: Record<string, unknown>): void {
  validateOptionalField(tx, 'CurveType', isNumber)
  validateOptionalField(tx, 'TickLower', isNumber)
  validateOptionalField(tx, 'TickUpper', isNumber)
  validateOptionalField(tx, 'BinID', isNumber)

  if (tx.CurveType === AMMCurveType.concentratedLiquidity) {
    validateConcentratedLiquidityDeposit(tx)
  } else if (tx.CurveType === AMMCurveType.binned) {
    validateBinnedDeposit(tx)
  } else if (
    tx.TickLower !== undefined ||
    tx.TickUpper !== undefined ||
    tx.BinID !== undefined
  ) {
    throw new ValidationError(
      `AMMDeposit: TickLower, TickUpper and BinID are only allowed when CurveType is ${AMMCurveType.concentratedLiquidity} or ${AMMCurveType.binned}`,
    )
  }
}

/**
 * Check a deposit into a concentrated liquidity AMM.
 *
 * @param tx - An AMMDeposit Transaction with `CurveType` 1.
 * @throws When the mode flag is not tfTwoAsset or tfSingleAsset, or the tick range is missing or invalid.
 */
function validateConcentratedLiquidityDeposit(tx: AMMDepositCurveFields): void {
  const modeFlags = getDepositModeFlags(tx)
  if (
    modeFlags !== AMMDepositFlags.tfTwoAsset &&
    modeFlags !== AMMDepositFlags.tfSingleAsset
  ) {
    throw new ValidationError(
      `AMMDeposit: CurveType ${AMMCurveType.concentratedLiquidity} requires the tfTwoAsset or tfSingleAsset flag`,
    )
  }
  if (tx.TickLower === undefined || tx.TickUpper === undefined) {
    throw new ValidationError(
      `AMMDeposit: TickLower and TickUpper are required when CurveType is ${AMMCurveType.concentratedLiquidity}`,
    )
  }
  if (tx.TickLower >= tx.TickUpper) {
    throw new ValidationError(
      'AMMDeposit: TickLower must be less than TickUpper',
    )
  }
  if (tx.TickLower < AMM_MIN_TICK || tx.TickUpper > AMM_MAX_TICK) {
    throw new ValidationError(
      `AMMDeposit: TickLower and TickUpper must be between ${AMM_MIN_TICK} and ${AMM_MAX_TICK}`,
    )
  }
}

/**
 * Check a deposit into a binned AMM.
 *
 * @param tx - An AMMDeposit Transaction with `CurveType` 3.
 * @throws When the mode flag is not tfTwoAsset, `BinID` is missing or out of range, or a tick field is present.
 */
function validateBinnedDeposit(tx: AMMDepositCurveFields): void {
  if (getDepositModeFlags(tx) !== AMMDepositFlags.tfTwoAsset) {
    throw new ValidationError(
      `AMMDeposit: CurveType ${AMMCurveType.binned} requires the tfTwoAsset flag`,
    )
  }
  if (tx.BinID === undefined) {
    throw new ValidationError(
      `AMMDeposit: BinID is required when CurveType is ${AMMCurveType.binned}`,
    )
  }
  if (!isAMMBinIDInRange(tx.BinID)) {
    throw new ValidationError(
      `AMMDeposit: BinID must be between ${AMM_MIN_BIN_ID} and ${AMM_MAX_BIN_ID}`,
    )
  }
  if (tx.TickLower !== undefined || tx.TickUpper !== undefined) {
    throw new ValidationError(
      `AMMDeposit: TickLower and TickUpper are not allowed when CurveType is ${AMMCurveType.binned}`,
    )
  }
}
