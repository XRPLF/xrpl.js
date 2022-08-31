/* eslint-disable complexity -- required for validateAMMDeposit */
import { ValidationError } from '../../errors'
import { Amount, IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isIssuedCurrency,
  validateBaseTransaction,
} from './common'

/**
 * AMMDeposit is the deposit transaction used to add liquidity to the AMM instance pool,
 * thus obtaining some share of the instance's pools in the form of LPToken.
 *
 * The following are the recommended valid combinations:
 * - LPToken
 * - Asset1In
 * - Asset1In and Asset2In
 * - Asset1In and LPToken
 * - Asset1In and EPrice
 */
export interface AMMDeposit extends BaseTransaction {
  TransactionType: 'AMMDeposit'

  /**
   * A hash that uniquely identifies the AMM instance. This field is required.
   */
  AMMID: string

  /**
   * Specifies the amount of shares of the AMM instance pools that the trader
   * wants to redeem or trade in.
   */
  LPToken?: IssuedCurrencyAmount

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance to
   * deposit more of its value.
   */
  Asset1In?: Amount

  /**
   * Specifies the other pool asset of the AMM instance to deposit more of
   * its value.
   */
  Asset2In?: Amount

  /**
   * Specifies the maximum effective-price that LPToken can be traded out.
   */
  EPrice?: Amount
}

/**
 * Verify the form and type of an AMMDeposit at runtime.
 *
 * @param tx - An AMMDeposit Transaction.
 * @throws When the AMMDeposit is Malformed.
 */
export function validateAMMDeposit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.AMMID == null) {
    throw new ValidationError('AMMDeposit: missing field AMMID')
  }

  if (typeof tx.AMMID !== 'string') {
    throw new ValidationError('AMMDeposit: AMMID must be a string')
  }

  if (tx.Asset2In != null && tx.Asset1In == null) {
    throw new ValidationError('AMMDeposit: must set Asset1In with Asset2In')
  } else if (tx.EPrice != null && tx.Asset1In == null) {
    throw new ValidationError('AMMDeposit: must set Asset1In with EPrice')
  } else if (tx.LPToken == null && tx.Asset1In == null) {
    throw new ValidationError(
      'AMMDeposit: must set at least LPToken or Asset1In',
    )
  }

  if (tx.LPToken != null && !isIssuedCurrency(tx.LPToken)) {
    throw new ValidationError(
      'AMMDeposit: LPToken must be an IssuedCurrencyAmount',
    )
  }

  if (tx.Asset1In != null && !isAmount(tx.Asset1In)) {
    throw new ValidationError('AMMDeposit: Asset1In must be an Amount')
  }

  if (tx.Asset2In != null && !isAmount(tx.Asset2In)) {
    throw new ValidationError('AMMDeposit: Asset2In must be an Amount')
  }

  if (tx.EPrice != null && typeof tx.EPrice !== 'string') {
    throw new ValidationError('AMMDeposit: EPrice must be an Amount')
  }
}
