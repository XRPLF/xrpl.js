/* eslint-disable complexity -- required for validateAMMWithdraw */
import { ValidationError } from '../../errors'
import { Amount, IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isIssuedCurrency,
  validateBaseTransaction,
} from './common'

/**
 * AMMWithdraw is the withdraw transaction used to remove liquidity from the AMM
 * instance pool, thus redeeming some share of the pools that one owns in the form
 * of LPToken.
 *
 * The following are the recommended valid combinations:
 * - LPToken
 * - Asset1Out
 * - Asset1Out and Asset2Out
 * - Asset1Out and LPToken
 * - Asset1Out and EPrice
 */
export interface AMMWithdraw extends BaseTransaction {
  TransactionType: 'AMMWithdraw'

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
   * Specifies one of the pools assets that the trader wants to remove.
   * If the asset is XRP, then the Asset1Out is a string specifying the number of drops.
   * Otherwise it is an IssuedCurrencyAmount object.
   */
  Asset1Out?: Amount

  /**
   * Specifies the other pool asset that the trader wants to remove.
   */
  Asset2Out?: Amount

  /**
   * Specifies the effective-price of the token out after successful execution of
   * the transaction.
   */
  EPrice?: Amount
}

/**
 * Verify the form and type of an AMMWithdraw at runtime.
 *
 * @param tx - An AMMWithdraw Transaction.
 * @throws When the AMMWithdraw is Malformed.
 */
export function validateAMMWithdraw(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.AMMID == null) {
    throw new ValidationError('AMMWithdraw: missing field AMMID')
  }

  if (typeof tx.AMMID !== 'string') {
    throw new ValidationError('AMMWithdraw: AMMID must be a string')
  }

  if (tx.Asset2Out != null && tx.Asset1Out == null) {
    throw new ValidationError('AMMWithdraw: must set Asset1Out with Asset2Out')
  } else if (tx.EPrice != null && tx.Asset1Out == null) {
    throw new ValidationError('AMMWithdraw: must set Asset1Out with EPrice')
  } else if (tx.LPToken == null && tx.Asset1Out == null) {
    throw new ValidationError(
      'AMMWithdraw: must set at least LPToken or Asset1Out',
    )
  }

  if (tx.LPToken != null && !isIssuedCurrency(tx.LPToken)) {
    throw new ValidationError(
      'AMMWithdraw: LPToken must be an IssuedCurrencyAmount',
    )
  }

  if (tx.Asset1Out != null && !isAmount(tx.Asset1Out)) {
    throw new ValidationError('AMMWithdraw: Asset1Out must be an Amount')
  }

  if (tx.Asset2Out != null && !isAmount(tx.Asset2Out)) {
    throw new ValidationError('AMMWithdraw: Asset2Out must be an Amount')
  }

  if (tx.EPrice != null && !isAmount(tx.EPrice)) {
    throw new ValidationError('AMMWithdraw: EPrice must be an Amount')
  }
}
