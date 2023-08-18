import { ValidationError } from '../../errors'
import { Currency } from '../common'

import { AMM_MAX_TRADING_FEE } from './AMMCreate'
import { BaseTransaction, isCurrency, validateBaseTransaction } from './common'

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
   */
  TradingFee: number
}

/**
 * Verify the form and type of an AMMVote at runtime.
 *
 * @param tx - An AMMVote Transaction.
 * @throws When the AMMVote is Malformed.
 */
export function validateAMMVote(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Asset == null) {
    throw new ValidationError('AMMVote: missing field Asset')
  }

  if (!isCurrency(tx.Asset)) {
    throw new ValidationError('AMMVote: Asset must be a Currency')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMVote: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMVote: Asset2 must be a Currency')
  }

  if (tx.TradingFee == null) {
    throw new ValidationError('AMMVote: missing field TradingFee')
  }

  if (typeof tx.TradingFee !== 'number') {
    throw new ValidationError('AMMVote: TradingFee must be a number')
  }

  if (tx.TradingFee < 0 || tx.TradingFee > AMM_MAX_TRADING_FEE) {
    throw new ValidationError(
      `AMMVote: TradingFee must be between 0 and ${AMM_MAX_TRADING_FEE}`,
    )
  }
}
