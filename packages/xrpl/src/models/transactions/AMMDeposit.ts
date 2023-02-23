/* eslint-disable complexity -- required for validateAMMDeposit */
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
 * Enum representing values for AMMDeposit Transaction Flags.
 *
 * @category Transaction Flags
 */
export enum AMMDepositFlags {
  tfLPToken = 0x00010000,
  tfSingleAsset = 0x00080000,
  tfTwoAsset = 0x00100000,
  tfOneAssetLPToken = 0x00200000,
  tfLimitLPToken = 0x00400000,
}

export interface AMMDepositFlagsInterface extends GlobalFlags {
  tfLPToken?: boolean
  tfSingleAsset?: boolean
  tfTwoAsset?: boolean
  tfOneAssetLPToken?: boolean
  tfLimitLPToken?: boolean
}

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
  Asset: Currency

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Asset2: Currency

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

  if (tx.Asset == null) {
    throw new ValidationError('AMMDeposit: missing field Asset')
  }

  if (!isCurrency(tx.Asset)) {
    throw new ValidationError('AMMDeposit: Asset must be an Issue')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMDeposit: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMDeposit: Asset2 must be an Issue')
  }

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
