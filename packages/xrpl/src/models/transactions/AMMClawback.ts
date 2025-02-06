import { ValidationError } from '../../errors'
import { Amount, Currency, IssuedCurrency } from '../common'

import {
  Account,
  BaseTransaction,
  GlobalFlags,
  isAccount,
  isAmount,
  isCurrency,
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
export interface AMMClawbackFlagsInterface extends GlobalFlags {
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
   * In JSON, this is an object with currency and issuer fields. The issuer field must match with Account.
   */
  Asset: IssuedCurrency

  /**
   * Specifies the other asset in the AMM's pool. In JSON, this is an object with currency and
   * issuer fields (omit issuer for XRP).
   */
  Asset2: Currency

  /**
   * The maximum amount to claw back from the AMM account. The currency and issuer subfields should match
   * the Asset subfields. If this field isn't specified, or the value subfield exceeds the holder's available
   * tokens in the AMM, all of the holder's tokens will be clawed back.
   */
  Amount?: Amount
}

/**
 * Verify the form and type of an AMMClawback at runtime.
 *
 * @param tx - An AMMClawback Transaction.
 * @throws When the AMMClawback is Malformed.
 */
export function validateAMMClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Holder', isAccount)

  validateRequiredField(tx, 'Asset', isCurrency)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for comparing tx.Asset.issuer
  // @ts-expect-error -- used for comparing tx.Asset.issuer
  if (tx.Holder === tx.Asset.issuer) {
    throw new ValidationError(
      'AMMClawback: Holder and Asset.issuer must be distinct',
    )
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for comparing tx.Asset.issuer
  // @ts-expect-error -- used for comparing tx.Asset.issuer
  if (tx.Account !== tx.Asset.issuer) {
    throw new ValidationError(
      'AMMClawback: Account must be the same as Asset.issuer',
    )
  }

  validateRequiredField(tx, 'Asset2', isCurrency)

  validateOptionalField(tx, 'Amount', isAmount)

  if (tx.Amount != null) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for comparing tx.Asset.currency
    // @ts-expect-error -- used for comparing tx.Asset.currency
    if (tx.Amount.currency !== tx.Asset.currency) {
      throw new ValidationError(
        'AMMClawback: currency for both Amount and Asset must be the same',
      )
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for comparing tx.Asset.issuer
    // @ts-expect-error -- used for comparing tx.Asset.issuer
    if (tx.Amount.issuer !== tx.Asset.issuer) {
      throw new ValidationError(
        'AMMClawback: issuer must be identical for both Amount and Asset',
      )
    }
  }
}
