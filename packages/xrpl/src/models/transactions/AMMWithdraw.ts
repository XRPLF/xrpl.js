import { ValidationError } from '../../errors'
import { Amount, Currency, IssuedCurrencyAmount } from '../common'
import { hasFlag, isHex } from '../utils'

import {
  AMM_MAX_BIN_ID,
  AMM_MIN_BIN_ID,
  AMMCurveType,
  isAMMBinIDInRange,
} from './AMMCreate'
import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAmount,
  isIssuedCurrency,
  isIssuedCurrencyAmount,
  isLedgerEntryId,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

const MAX_UINT64_HEX_LENGTH = 16

/**
 * Enum representing values for AMMWithdrawFlags Transaction Flags.
 *
 * @category Transaction Flags
 */
export enum AMMWithdrawFlags {
  tfLPToken = 0x00010000,
  tfWithdrawAll = 0x00020000,
  tfOneAssetWithdrawAll = 0x00040000,
  tfSingleAsset = 0x00080000,
  tfTwoAsset = 0x00100000,
  tfOneAssetLPToken = 0x00200000,
  tfLimitLPToken = 0x00400000,
}

export interface AMMWithdrawFlagsInterface extends GlobalFlagsInterface {
  tfLPToken?: boolean
  tfWithdrawAll?: boolean
  tfOneAssetWithdrawAll?: boolean
  tfSingleAsset?: boolean
  tfTwoAsset?: boolean
  tfOneAssetLPToken?: boolean
  tfLimitLPToken?: boolean
}

/**
 * Withdraw assets from an Automated Market Maker (AMM) instance by returning the AMM's liquidity provider tokens (LP Tokens).
 */
export interface AMMWithdraw extends BaseTransaction {
  TransactionType: 'AMMWithdraw'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The amount of one asset to withdraw from the AMM.
   * This must match the type of one of the assets (tokens or XRP) in the AMM's pool.
   */
  Amount?: Amount

  /**
   * The amount of another asset to withdraw from the AMM.
   * If present, this must match the type of the other asset in the AMM's pool and cannot be the same type as Amount.
   */
  Amount2?: Amount

  /**
   * The minimum effective price, in LP Token returned, to pay per unit of the asset to withdraw.
   */
  EPrice?: Amount

  /**
   * How many of the AMM's LP Tokens to redeem.
   */
  LPTokenIn?: IssuedCurrencyAmount

  /**
   * (AMMCurves) The curve type of the AMM to withdraw from, one of {@link AMMCurveType}.
   * Defaults to the constant-product curve (0).
   */
  CurveType?: number

  /**
   * (AMMCurves) The ledger entry ID of the concentrated liquidity position (an AMMPosition) to withdraw from.
   * Required when `CurveType` is 1.
   */
  PositionID?: string

  /**
   * (AMMCurves) How much of the position's liquidity to withdraw, as a hex-encoded 64-bit unsigned integer.
   * The whole position when omitted. Only allowed when `CurveType` is 1.
   */
  PositionLiquidity?: string

  /**
   * (AMMCurves) The bin of a binned AMM to withdraw from, from -221818 to 221818.
   * Required when `CurveType` is 3.
   */
  BinID?: number

  /**
   * (AMMCurves) How many of the bin's shares to redeem, as a non-zero hex-encoded 64-bit unsigned integer.
   * When `CurveType` is 3, exactly one of `Shares` or the tfWithdrawAll flag is required,
   * and `Shares` is used with no withdrawal mode flag.
   */
  Shares?: string
}

interface AMMWithdrawCurveFields extends Record<string, unknown> {
  CurveType?: number
  PositionID?: string
  PositionLiquidity?: string
  BinID?: number
  Shares?: string
}

/**
 * Verify the form and type of an AMMWithdraw at runtime.
 *
 * @param tx - An AMMWithdraw Transaction.
 * @throws When the AMMWithdraw is Malformed.
 */
export function validateAMMWithdraw(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isIssuedCurrency)

  validateRequiredField(tx, 'Asset2', isIssuedCurrency)

  if (tx.Amount2 != null && tx.Amount == null) {
    throw new ValidationError('AMMWithdraw: must set Amount with Amount2')
  } else if (tx.EPrice != null && tx.Amount == null) {
    throw new ValidationError('AMMWithdraw: must set Amount with EPrice')
  }

  validateOptionalField(tx, 'LPTokenIn', isIssuedCurrencyAmount)
  validateOptionalField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Amount2', isAmount)
  validateOptionalField(tx, 'EPrice', isAmount)

  validateCurveFields(tx)
}

/**
 * Check that a value is a hex-encoded 64-bit unsigned integer.
 *
 * @param input - The value to check.
 * @returns Whether `input` is a string of 1 to 16 hex digits.
 */
function isUInt64Hex(input: unknown): input is string {
  return (
    isString(input) && input.length <= MAX_UINT64_HEX_LENGTH && isHex(input)
  )
}

/**
 * Sum the AMMWithdraw mode flags (the {@link AMMWithdrawFlags}) set on a transaction.
 *
 * @param tx - An AMMWithdraw Transaction.
 * @returns The mode flags set on `tx`, as a number.
 */
function getWithdrawModeFlags(tx: Record<string, unknown>): number {
  return Object.entries(AMMWithdrawFlags).reduce((flags, [name, value]) => {
    if (typeof value === 'number' && hasFlag(tx, value, name)) {
      return flags + value
    }
    return flags
  }, 0)
}

/**
 * Check whether an AMMWithdraw names an amount of assets or LP Tokens.
 *
 * @param tx - An AMMWithdraw Transaction.
 * @returns Whether any of Amount, Amount2, EPrice or LPTokenIn is present.
 */
function hasAmountFields(tx: Record<string, unknown>): boolean {
  return (
    tx.Amount !== undefined ||
    tx.Amount2 !== undefined ||
    tx.EPrice !== undefined ||
    tx.LPTokenIn !== undefined
  )
}

/**
 * Check the position and bin fields of an AMMWithdraw against its `CurveType`.
 *
 * @param tx - An AMMWithdraw Transaction.
 * @throws When a curve field has the wrong type, a field the curve type requires
 * is missing or invalid, or a field the curve type does not use is present.
 */
function validateCurveFields(tx: Record<string, unknown>): void {
  validateOptionalField(tx, 'CurveType', isNumber)
  validateOptionalField(tx, 'PositionID', isLedgerEntryId)
  validateOptionalField(tx, 'PositionLiquidity', isUInt64Hex)
  validateOptionalField(tx, 'BinID', isNumber)
  validateOptionalField(tx, 'Shares', isUInt64Hex)

  if (tx.CurveType === AMMCurveType.concentratedLiquidity) {
    validateConcentratedLiquidityWithdraw(tx)
  } else if (tx.CurveType === AMMCurveType.binned) {
    validateBinnedWithdraw(tx)
  } else if (
    tx.PositionID !== undefined ||
    tx.PositionLiquidity !== undefined ||
    tx.BinID !== undefined
  ) {
    throw new ValidationError(
      `AMMWithdraw: PositionID, PositionLiquidity and BinID are only allowed when CurveType is ${AMMCurveType.concentratedLiquidity} or ${AMMCurveType.binned}`,
    )
  }
}

/**
 * Check a withdrawal from a concentrated liquidity AMM.
 *
 * @param tx - An AMMWithdraw Transaction with `CurveType` 1.
 * @throws When the mode flag is not tfWithdrawAll, `PositionID` is missing, or an amount field is present.
 */
function validateConcentratedLiquidityWithdraw(
  tx: AMMWithdrawCurveFields,
): void {
  if (getWithdrawModeFlags(tx) !== AMMWithdrawFlags.tfWithdrawAll) {
    throw new ValidationError(
      `AMMWithdraw: CurveType ${AMMCurveType.concentratedLiquidity} requires the tfWithdrawAll flag`,
    )
  }
  if (tx.PositionID === undefined) {
    throw new ValidationError(
      `AMMWithdraw: PositionID is required when CurveType is ${AMMCurveType.concentratedLiquidity}`,
    )
  }
  if (hasAmountFields(tx)) {
    throw new ValidationError(
      `AMMWithdraw: Amount, Amount2, EPrice and LPTokenIn are not allowed when CurveType is ${AMMCurveType.concentratedLiquidity}`,
    )
  }
}

/**
 * Check a withdrawal from a binned AMM.
 *
 * @param tx - An AMMWithdraw Transaction with `CurveType` 3.
 * @throws When neither or both of tfWithdrawAll and `Shares` are used, `BinID` is missing or
 * out of range, an amount field is present, or `Shares` is zero.
 */
function validateBinnedWithdraw(tx: AMMWithdrawCurveFields): void {
  const modeFlags = getWithdrawModeFlags(tx)
  const withdrawAll =
    modeFlags === AMMWithdrawFlags.tfWithdrawAll && tx.Shares === undefined
  const withdrawShares = modeFlags === 0 && tx.Shares !== undefined
  if (!withdrawAll && !withdrawShares) {
    throw new ValidationError(
      `AMMWithdraw: CurveType ${AMMCurveType.binned} requires exactly one of the tfWithdrawAll flag or Shares`,
    )
  }
  if (tx.BinID === undefined) {
    throw new ValidationError(
      `AMMWithdraw: BinID is required when CurveType is ${AMMCurveType.binned}`,
    )
  }
  if (hasAmountFields(tx)) {
    throw new ValidationError(
      `AMMWithdraw: Amount, Amount2, EPrice and LPTokenIn are not allowed when CurveType is ${AMMCurveType.binned}`,
    )
  }
  if (tx.Shares !== undefined && BigInt(`0x${tx.Shares}`) === BigInt(0)) {
    throw new ValidationError('AMMWithdraw: Shares must not be zero')
  }
  if (!isAMMBinIDInRange(tx.BinID)) {
    throw new ValidationError(
      `AMMWithdraw: BinID must be between ${AMM_MIN_BIN_ID} and ${AMM_MAX_BIN_ID}`,
    )
  }
}
