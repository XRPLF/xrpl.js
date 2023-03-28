/* eslint-disable complexity -- required for validateAMMWithdraw */
import { ValidationError } from '../../errors'
import { Amount, Currency, IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  isAmount,
  isCurrency,
  isIssuedCurrency,
  validateBaseTransaction,
} from './common'

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

export interface AMMWithdrawFlagsInterface extends GlobalFlags {
  tfLPToken?: boolean
  tfWithdrawAll?: boolean
  tfOneAssetWithdrawAll?: boolean
  tfSingleAsset?: boolean
  tfTwoAsset?: boolean
  tfOneAssetLPToken?: boolean
  tfLimitLPToken?: boolean
}

/**
 * AMMWithdraw is the withdraw transaction used to remove liquidity from the AMM
 * instance pool, thus redeeming some share of the pools that one owns in the form
 * of LPTokenIn.
 *
 * The following are the recommended valid combinations:
 * - LPTokenIn
 * - Amount
 * - Amount and Amount2
 * - Amount and LPTokenIn
 * - Amount and EPrice
 */
export interface AMMWithdraw extends BaseTransaction {
  TransactionType: 'AMMWithdraw'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   */
  Asset: Currency

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Asset2: Currency

  /**
   * Specifies the amount of shares of the AMM instance pools that the trader
   * wants to redeem or trade in.
   */
  LPTokenIn?: IssuedCurrencyAmount

  /**
   * Specifies one of the pools assets that the trader wants to remove.
   * If the asset is XRP, then the Amount is a string specifying the number of drops.
   * Otherwise it is an IssuedCurrencyAmount object.
   */
  Amount?: Amount

  /**
   * Specifies the other pool asset that the trader wants to remove.
   */
  Amount2?: Amount

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

  if (tx.Asset == null) {
    throw new ValidationError('AMMWithdraw: missing field Asset')
  }

  if (!isCurrency(tx.Asset)) {
    throw new ValidationError('AMMWithdraw: Asset must be an Issue')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMWithdraw: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMWithdraw: Asset2 must be an Issue')
  }

  if (tx.Amount2 != null && tx.Amount == null) {
    throw new ValidationError('AMMWithdraw: must set Amount with Amount2')
  } else if (tx.EPrice != null && tx.Amount == null) {
    throw new ValidationError('AMMWithdraw: must set Amount with EPrice')
  }

  if (tx.LPTokenIn != null && !isIssuedCurrency(tx.LPTokenIn)) {
    throw new ValidationError(
      'AMMWithdraw: LPTokenIn must be an IssuedCurrencyAmount',
    )
  }

  if (tx.Amount != null && !isAmount(tx.Amount)) {
    throw new ValidationError('AMMWithdraw: Amount must be an Amount')
  }

  if (tx.Amount2 != null && !isAmount(tx.Amount2)) {
    throw new ValidationError('AMMWithdraw: Amount2 must be an Amount')
  }

  if (tx.EPrice != null && !isAmount(tx.EPrice)) {
    throw new ValidationError('AMMWithdraw: EPrice must be an Amount')
  }
}
