import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, isAmount, validateBaseTransaction } from './common'

export const AMM_MAX_TRADING_FEE = 65000

/**
 * AMMInstanceCreate is used to create AccountRoot and the corresponding
 * AMM ledger entries.
 *
 * This allows for the creation of only one AMM instance per unique asset pair.
 */
export interface AMMInstanceCreate extends BaseTransaction {
  TransactionType: 'AMMInstanceCreate'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   */
  Asset1: Amount

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Asset2: Amount

  /**
   * Specifies the fee, in basis point, to be charged
   * to the traders for the trades executed against the AMM instance.
   * Trading fee is a percentage of the trading volume.
   * Valid values for this field are between 0 and 65000 inclusive.
   * A value of 1 is equivalent to 1/10 bps or 0.001%, allowing trading fee
   * between 0% and 65%.
   */
  TradingFee: number
}

/**
 * Verify the form and type of an AMMInstanceCreate at runtime.
 *
 * @param tx - An AMMInstanceCreate Transaction.
 * @throws When the AMMInstanceCreate is Malformed.
 */
export function validateAMMInstanceCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Asset1 == null) {
    throw new ValidationError('AMMInstanceCreate: missing field Asset1')
  }

  if (!isAmount(tx.Asset1)) {
    throw new ValidationError('AMMInstanceCreate: Asset1 must be an Amount')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMInstanceCreate: missing field Asset2')
  }

  if (!isAmount(tx.Asset2)) {
    throw new ValidationError('AMMInstanceCreate: Asset2 must be an Amount')
  }

  if (tx.TradingFee == null) {
    throw new ValidationError('AMMInstanceCreate: missing field TradingFee')
  }

  if (typeof tx.TradingFee !== 'number') {
    throw new ValidationError('AMMInstanceCreate: TradingFee must be a number')
  }

  if (tx.TradingFee > AMM_MAX_TRADING_FEE) {
    throw new ValidationError(
      `AMMInstanceCreate: TradingFee must not be greater than ${AMM_MAX_TRADING_FEE}`,
    )
  }
}
