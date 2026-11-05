import { ValidationError } from '../../errors'
import { Currency } from '../common'

import {
  AMM_MAX_AMPLIFICATION,
  AMM_MAX_TRADING_FEE,
  AMM_MIN_AMPLIFICATION,
  isAMMAmplificationInRange,
} from './AMMCreate'
import {
  BaseTransaction,
  isIssuedCurrency,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Vote on the trading fee for an Automated Market Maker (AMM) instance.
 *
 * Up to 8 accounts can vote in proportion to the amount of the AMM's LP Tokens they hold.
 * Each new vote re-calculates the AMM's trading fee based on a weighted average of the votes.
 */
export interface AMMVote extends BaseTransaction {
  TransactionType: 'AMMVote'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The proposed fee to vote for, in units of 1/100,000; a value of 1 is equivalent to 0.001%.
   * The maximum value is 1000, indicating a 1% fee.
   * Optional since AMMCurves, so that a vote can carry only `Amplification`.
   */
  TradingFee?: number

  /**
   * (AMMCurves) The curve type of the AMM to vote on, one of {@link AMMCurveType}.
   * Defaults to the constant-product curve (0).
   */
  CurveType?: number

  /**
   * (AMMCurves) The proposed amplification coefficient of a StableSwap AMM, from 1 to 5000.
   */
  Amplification?: number
}

/**
 * Verify the form and type of an AMMVote at runtime.
 *
 * @param tx - An AMMVote Transaction.
 * @throws When the AMMVote is Malformed.
 */
export function validateAMMVote(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isIssuedCurrency)

  validateRequiredField(tx, 'Asset2', isIssuedCurrency)

  validateOptionalField(tx, 'TradingFee', isNumber)

  if (
    typeof tx.TradingFee === 'number' &&
    (tx.TradingFee < 0 || tx.TradingFee > AMM_MAX_TRADING_FEE)
  ) {
    throw new ValidationError(
      `AMMVote: TradingFee must be between 0 and ${AMM_MAX_TRADING_FEE}`,
    )
  }

  validateOptionalField(tx, 'CurveType', isNumber)
  validateOptionalField(tx, 'Amplification', isNumber)

  if (
    tx.Amplification !== undefined &&
    !isAMMAmplificationInRange(tx.Amplification)
  ) {
    throw new ValidationError(
      `AMMVote: Amplification must be between ${AMM_MIN_AMPLIFICATION} and ${AMM_MAX_AMPLIFICATION}`,
    )
  }
}
