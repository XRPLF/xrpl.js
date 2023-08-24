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
    throw new ValidationError('AMMWithdraw: Asset must be a Currency')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMWithdraw: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMWithdraw: Asset2 must be a Currency')
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
