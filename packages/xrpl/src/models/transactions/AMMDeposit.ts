import { ValidationError } from '../../errors'
import { Amount, Currency, IssuedCurrencyAmount } from '../common'

import { AMM_MAX_TRADING_FEE } from './AMMCreate'
// eslint-disable-next-line import/no-cycle -- AMM flag conversion maps transaction types to their flags
import { validateAMMMode } from './AMMValidation'
import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAmount,
  isIssuedCurrency,
  isIssuedCurrencyAmount,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
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

export interface AMMDepositFlagsInterface extends GlobalFlagsInterface {
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

  /** Trading fee in units of 1/100,000, allowed when refilling an empty AMM. */
  TradingFee?: number
}

/**
 * Verify the form and type of an AMMDeposit at runtime.
 *
 * @param tx - An AMMDeposit Transaction.
 * @throws When the AMMDeposit is Malformed.
 */
// eslint-disable-next-line max-lines-per-function -- keep the mode rules beside the validator
export function validateAMMDeposit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isIssuedCurrency)

  validateRequiredField(tx, 'Asset2', isIssuedCurrency)

  if (tx.Amount2 != null && tx.Amount == null) {
    throw new ValidationError('AMMDeposit: must set Amount with Amount2')
  } else if (tx.EPrice != null && tx.Amount == null) {
    throw new ValidationError('AMMDeposit: must set Amount with EPrice')
  } else if (tx.LPTokenOut == null && tx.Amount == null) {
    throw new ValidationError(
      'AMMDeposit: must set at least LPTokenOut or Amount',
    )
  }

  validateOptionalField(tx, 'LPTokenOut', isIssuedCurrencyAmount)
  validateOptionalField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Amount2', isAmount)
  validateOptionalField(tx, 'EPrice', isAmount)

  const fields = ['Amount', 'Amount2', 'EPrice', 'LPTokenOut', 'TradingFee']
  validateAMMMode(
    tx,
    [
      {
        flag: AMMDepositFlags.tfLPToken,
        required: ['LPTokenOut'],
        allowed: ['LPTokenOut', 'Amount', 'Amount2'],
        paired: ['Amount', 'Amount2'],
      },
      {
        flag: AMMDepositFlags.tfSingleAsset,
        required: ['Amount'],
        allowed: ['Amount', 'LPTokenOut'],
      },
      {
        flag: AMMDepositFlags.tfTwoAsset,
        required: ['Amount', 'Amount2'],
        allowed: ['Amount', 'Amount2', 'LPTokenOut'],
      },
      {
        flag: AMMDepositFlags.tfOneAssetLPToken,
        required: ['Amount', 'LPTokenOut'],
        allowed: ['Amount', 'LPTokenOut'],
      },
      {
        flag: AMMDepositFlags.tfLimitLPToken,
        required: ['Amount', 'EPrice'],
        allowed: ['Amount', 'EPrice'],
      },
      {
        flag: AMMDepositFlags.tfTwoAssetIfEmpty,
        required: ['Amount', 'Amount2'],
        allowed: ['Amount', 'Amount2', 'TradingFee'],
      },
    ],
    fields,
  )

  if (
    tx.TradingFee != null &&
    (typeof tx.TradingFee !== 'number' ||
      !Number.isInteger(tx.TradingFee) ||
      tx.TradingFee < 0 ||
      tx.TradingFee > AMM_MAX_TRADING_FEE)
  ) {
    throw new ValidationError(
      `AMMDeposit: TradingFee must be an integer between 0 and ${AMM_MAX_TRADING_FEE}`,
    )
  }
}
