/* eslint-disable complexity -- required for validateAMMDeposit */
import { ValidationError } from '../../errors'
import { Amount, Issue, IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isIssuedCurrency,
  validateBaseTransaction,
} from './common'

/**
 * AMMDeposit is the deposit transaction used to add liquidity to the AMM instance pool,
 * thus obtaining some share of the instance's pools in the form of LPTokenOut.
 *
 * The following are the recommended valid combinations:
 * - LPTokenOut
 * - Amount
 * - Amount and Amount2
 * - Amount and LPTokenOut
 * - Amount and EPrice
 */
export interface AMMDeposit extends BaseTransaction {
  TransactionType: 'AMMDeposit'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   */
  Asset: Issue

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Asset2: Issue

  /**
   * Specifies the amount of shares of the AMM instance pools that the trader
   * wants to redeem or trade in.
   */
  LPTokenOut?: IssuedCurrencyAmount

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance to
   * deposit more of its value.
   */
  Amount?: Amount

  /**
   * Specifies the other pool asset of the AMM instance to deposit more of
   * its value.
   */
  Amount2?: Amount

  /**
   * Specifies the maximum effective-price that LPTokenOut can be traded out.
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

  if (tx.Amount2 != null && tx.Amount == null) {
    throw new ValidationError('AMMDeposit: must set Amount with Amount2')
  } else if (tx.EPrice != null && tx.Amount == null) {
    throw new ValidationError('AMMDeposit: must set Amount with EPrice')
  } else if (tx.LPTokenOut == null && tx.Amount == null) {
    throw new ValidationError(
      'AMMDeposit: must set at least LPTokenOut or Amount',
    )
  }

  if (tx.LPTokenOut != null && !isIssuedCurrency(tx.LPTokenOut)) {
    throw new ValidationError(
      'AMMDeposit: LPTokenOut must be an IssuedCurrencyAmount',
    )
  }

  if (tx.Amount != null && !isAmount(tx.Amount)) {
    throw new ValidationError('AMMDeposit: Amount must be an Amount')
  }

  if (tx.Amount2 != null && !isAmount(tx.Amount2)) {
    throw new ValidationError('AMMDeposit: Amount2 must be an Amount')
  }

  if (tx.EPrice != null && !isAmount(tx.EPrice)) {
    throw new ValidationError('AMMDeposit: EPrice must be an Amount')
  }
}
