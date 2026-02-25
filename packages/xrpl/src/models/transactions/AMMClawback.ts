import { ValidationError } from '../../errors'
import {
  Currency,
  IssuedCurrency,
  IssuedCurrencyAmount,
  MPTAmount,
  MPTCurrency,
} from '../common'

import {
  Account,
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isCurrency,
  isIssuedCurrency,
  isIssuedCurrencyAmount,
  isMPTAmount,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values for AMMClawback Transaction Flags.
 *
 * @category Transaction Flags
 */
export enum AMMClawbackFlags {
  tfClawTwoAssets = 0x00000001,
}

/**
 * Map of flags to boolean values representing {@link AMMClawback} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface AMMClawbackFlagsInterface extends GlobalFlagsInterface {
  tfClawTwoAssets?: boolean
}

/**
 * Claw back tokens from a holder that has deposited your issued tokens into an AMM pool.
 *
 * Clawback is disabled by default. To use clawback, you must send an AccountSet transaction to enable the
 * Allow Trust Line Clawback setting. An issuer with any existing tokens cannot enable clawback. You can
 * only enable Allow Trust Line Clawback if you have a completely empty owner directory, meaning you must
 * do so before you set up any trust lines, offers, escrows, payment channels, checks, or signer lists.
 * After you enable clawback, it cannot reverted: the account permanently gains the ability to claw back
 * issued assets on trust lines.
 */
export interface AMMClawback extends BaseTransaction {
  TransactionType: 'AMMClawback'

  /**
   * The account holding the asset to be clawed back.
   */
  Holder: Account

  /**
   * Specifies the asset that the issuer wants to claw back from the AMM pool.
   * In JSON, this is an object with currency and issuer fields (or mpt_issuance_id for MPT).
   * For issued currencies, the issuer field must match with Account.
   */
  Asset: IssuedCurrency | MPTCurrency

  /**
   * Specifies the other asset in the AMM's pool. In JSON, this is an object with currency and
   * issuer fields (omit issuer for XRP), or mpt_issuance_id for MPT.
   */
  Asset2: Currency

  /**
   * The maximum amount to claw back from the AMM account. For issued currencies, the currency and
   * issuer subfields should match the Asset subfields. For MPT, the mpt_issuance_id should match.
   * If this field isn't specified, or the value subfield exceeds the holder's available
   * tokens in the AMM, all of the holder's tokens will be clawed back.
   */
  Amount?: IssuedCurrencyAmount | MPTAmount
}

/**
 * Verify the form and type of Clawback Amount at runtime.
 *
 * @param input - The amount expected to be Clawed back.
 * @returns True if the input is an IssuedCurrencyAmount or MPTAmount.
 */
function isClawbackAmountValid(
  input: unknown,
): input is IssuedCurrencyAmount | MPTAmount {
  return isIssuedCurrencyAmount(input) || isMPTAmount(input)
}

/**
 * Validates an AMMClawback transaction.
 *
 * @param tx - The AMMClawback transaction to validate.
 * @throws {ValidationError} When the transaction fields are invalid.
 */
export function validateAMMClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Holder', isAccount)

  validateRequiredField(tx, 'Asset', isCurrency)

  const asset = tx.Asset

  if (isIssuedCurrency(asset)) {
    if (tx.Holder === asset.issuer) {
      throw new ValidationError(
        'AMMClawback: Holder and Asset.issuer must be distinct',
      )
    }

    if (tx.Account !== asset.issuer) {
      throw new ValidationError(
        'AMMClawback: Account must be the same as Asset.issuer',
      )
    }
  }

  validateRequiredField(tx, 'Asset2', isCurrency)

  validateOptionalField(tx, 'Amount', isClawbackAmountValid)

  if (
    tx.Amount != null &&
    isIssuedCurrencyAmount(tx.Amount) &&
    isIssuedCurrency(asset)
  ) {
    if (tx.Amount.currency !== asset.currency) {
      throw new ValidationError(
        'AMMClawback: Amount.currency must match Asset.currency',
      )
    }

    if (tx.Amount.issuer !== asset.issuer) {
      throw new ValidationError(
        'AMMClawback: Amount.issuer must match Amount.issuer',
      )
    }
  }
}
