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
  tfTwoAssetIfEmpty = 0x00800000,
}

export interface AMMDepositFlagsInterface extends GlobalFlags {
  tfLPToken?: boolean
  tfSingleAsset?: boolean
  tfTwoAsset?: boolean
  tfOneAssetLPToken?: boolean
  tfLimitLPToken?: boolean
  tfTwoAssetIfEmpty?: boolean
}

/**
 * Deposit funds into an Automated Market Maker (AMM) instance
 * and receive the AMM's liquidity provider tokens (LP Tokens) in exchange.
 *
 * You can deposit one or both of the assets in the AMM's pool.
 * If successful, this transaction creates a trust line to the AMM Account (limit 0) to hold the LP Tokens.
 */
export interface AMMDeposit extends BaseTransaction {
  TransactionType: 'AMMDeposit'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The amount of one asset to deposit to the AMM.
   * If present, this must match the type of one of the assets (tokens or XRP) in the AMM's pool.
   */
  Amount?: Amount

  /**
   * The amount of another asset to add to the AMM.
   * If present, this must match the type of the other asset in the AMM's pool and cannot be the same asset as Amount.
   */
  Amount2?: Amount

  /**
   * The maximum effective price, in the deposit asset, to pay for each LP Token received.
   */
  EPrice?: Amount

  /**
   * How many of the AMM's LP Tokens to buy.
   */
  LPTokenOut?: IssuedCurrencyAmount
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
    throw new ValidationError('AMMDeposit: Asset must be a Currency')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMDeposit: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMDeposit: Asset2 must be a Currency')
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
