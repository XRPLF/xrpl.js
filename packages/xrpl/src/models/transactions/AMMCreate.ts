import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, isAmount, validateBaseTransaction } from './common'

export const AMM_MAX_TRADING_FEE = 1000

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
}

/**
 * Verify the form and type of an AMMCreate at runtime.
 *
 * @param tx - An AMMCreate Transaction.
 * @throws When the AMMCreate is Malformed.
 */
export function validateAMMCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Amount == null) {
    throw new ValidationError('AMMCreate: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('AMMCreate: Amount must be an Amount')
  }

  if (tx.Amount2 == null) {
    throw new ValidationError('AMMCreate: missing field Amount2')
  }

  if (!isAmount(tx.Amount2)) {
    throw new ValidationError('AMMCreate: Amount2 must be an Amount')
  }

  if (tx.TradingFee == null) {
    throw new ValidationError('AMMCreate: missing field TradingFee')
  }

  if (typeof tx.TradingFee !== 'number') {
    throw new ValidationError('AMMCreate: TradingFee must be a number')
  }

  if (tx.TradingFee < 0 || tx.TradingFee > AMM_MAX_TRADING_FEE) {
    throw new ValidationError(
      `AMMCreate: TradingFee must be between 0 and ${AMM_MAX_TRADING_FEE}`,
    )
  }
}
