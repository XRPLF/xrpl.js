import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, isAmount, validateBaseTransaction } from './common'

export const AMM_MAX_TRADING_FEE = 1000

/**
 * AMMCreate is used to create AccountRoot and the corresponding
 * AMM ledger entries.
 *
 * This allows for the creation of only one AMM instance per unique asset pair.
 */
export interface AMMCreate extends BaseTransaction {
  TransactionType: 'AMMCreate'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   */
  Amount: Amount

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Amount2: Amount

  /**
   * Specifies the fee, in basis point, to be charged
   * to the traders for the trades executed against the AMM instance.
   * Trading fee is a percentage of the trading volume.
   * Valid values for this field are between 0 and 1000 inclusive.
   * A value of 1 is equivalent to 1/10 bps or 0.001%, allowing trading fee
   * between 0% and 1%.
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
