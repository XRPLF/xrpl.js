import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { INTEGER_SANITY_CHECK, isHex } from '../utils'
import { isSameAsset } from '../utils/amount'

import {
  Account,
  areAddressesEqual,
  BaseTransaction,
  isAccount,
  isAmount,
  isMPTAmount,
  isNumber,
  isString,
  validateBaseTransaction,
  validateFlagsMask,
  validateOptionalField,
  validateRequiredField,
} from './common'

/** Largest InterestRate, in 1/10 basis points (100%). */
const MAX_INTEREST_RATE = 100000

/** Largest Data length, in bytes. */
const MAX_REPO_DATA_BYTES = 256

/** Largest XRP amount, in drops. */
const MAX_XRP_DROPS = BigInt('100000000000000000')

/** Largest value of a 32-bit date field. */
const MAX_UINT32 = 0xffffffff

/**
 * The RepoCreate transaction offers a repurchase agreement to a counterparty
 * and locks the seller's collateral. The counterparty pays the PurchasePrice
 * with RepoAccept, and the seller repurchases the collateral with RepoClose.
 *
 * @category Transaction Models
 */
export interface RepoCreate extends BaseTransaction {
  TransactionType: 'RepoCreate'

  /** The buyer, the only account that may accept the repo. */
  Counterparty: Account

  /** The collateral the seller locks (XRP, IOU or MPT). Must be positive. */
  CollateralAmount: Amount | MPTAmount

  /**
   * The cash the buyer pays on accept (XRP, IOU or MPT). Must be positive and
   * a different asset from the CollateralAmount.
   */
  PurchasePrice: Amount | MPTAmount

  /** The interest rate in 1/10 basis points, between 0 and 100,000. */
  InterestRate: number

  /**
   * The time, in seconds since the Ripple Epoch, after which the offer can no
   * longer be accepted.
   */
  Expiration: number

  /**
   * The time, in seconds since the Ripple Epoch, by which the seller
   * repurchases the collateral. Must be after Expiration.
   */
  MaturityDate: number

  /**
   * Seconds after MaturityDate during which the seller may still repurchase.
   * MaturityDate plus GracePeriod must fit in 32 bits.
   */
  GracePeriod: number

  /** A reference to the governing legal annex, in hex, at most 256 bytes. */
  Data?: string
}

/**
 * Whether the input is an XRP, IOU or MPT amount.
 *
 * @param input - The value to check.
 * @returns Whether the input is an amount.
 */
function isRepoAmount(input: unknown): input is Amount | MPTAmount {
  return isAmount(input) || isMPTAmount(input)
}

/**
 * Verify an amount is positive and, for XRP, within the XRP supply.
 *
 * @param amount - The amount to check.
 * @param field - The field name, for the error message.
 * @throws When the amount is not positive or exceeds the XRP supply.
 */
function validatePositiveAmount(
  amount: Amount | MPTAmount,
  field: string,
): void {
  const value = typeof amount === 'string' ? amount : amount.value
  if (!(Number(value) > 0)) {
    throw new ValidationError(`RepoCreate: ${field} must be positive`)
  }
  if (
    typeof amount === 'string' &&
    INTEGER_SANITY_CHECK.test(amount) &&
    BigInt(amount) > MAX_XRP_DROPS
  ) {
    throw new ValidationError(
      `RepoCreate: ${field} exceeds the maximum XRP amount`,
    )
  }
}

/**
 * Verify the collateral and cash amounts.
 *
 * @param tx - A RepoCreate transaction.
 * @throws When an amount is malformed, not positive, or both are the same asset.
 */
function validateRepoAmounts(tx: Record<string, unknown>): void {
  validateRequiredField(tx, 'CollateralAmount', isRepoAmount)
  validateRequiredField(tx, 'PurchasePrice', isRepoAmount)
  validatePositiveAmount(tx.CollateralAmount, 'CollateralAmount')
  validatePositiveAmount(tx.PurchasePrice, 'PurchasePrice')

  if (isSameAsset(tx.CollateralAmount, tx.PurchasePrice)) {
    throw new ValidationError(
      'RepoCreate: CollateralAmount and PurchasePrice must be different assets',
    )
  }
}

/**
 * Verify the dates and the interest rate.
 *
 * @param tx - A RepoCreate transaction.
 * @throws When a date or the interest rate is malformed or out of range.
 */
function validateRepoTerms(tx: Record<string, unknown>): void {
  validateRequiredField(tx, 'InterestRate', isNumber)
  validateRequiredField(tx, 'Expiration', isNumber)
  validateRequiredField(tx, 'MaturityDate', isNumber)
  validateRequiredField(tx, 'GracePeriod', isNumber)

  if (tx.MaturityDate <= tx.Expiration) {
    throw new ValidationError(
      'RepoCreate: MaturityDate must be after Expiration',
    )
  }
  if (tx.GracePeriod > MAX_UINT32 - tx.MaturityDate) {
    throw new ValidationError(
      'RepoCreate: MaturityDate plus GracePeriod must fit in 32 bits',
    )
  }
  if (tx.InterestRate > MAX_INTEREST_RATE) {
    throw new ValidationError(
      `RepoCreate: InterestRate must not exceed ${MAX_INTEREST_RATE}`,
    )
  }
}

/**
 * Verify the form and type of a {@link RepoCreate} at runtime.
 *
 * @param tx - A {@link RepoCreate} Transaction.
 * @throws When the {@link RepoCreate} is malformed.
 */
export function validateRepoCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'Counterparty', isAccount)

  if (areAddressesEqual(tx.Counterparty, String(tx.Account))) {
    throw new ValidationError(
      'RepoCreate: Counterparty must not be the Account',
    )
  }

  validateRepoAmounts(tx)
  validateRepoTerms(tx)
  validateOptionalField(tx, 'Data', isString)

  if (
    tx.Data !== undefined &&
    (tx.Data.length % 2 !== 0 ||
      (tx.Data !== '' && !isHex(tx.Data)) ||
      tx.Data.length / 2 > MAX_REPO_DATA_BYTES)
  ) {
    throw new ValidationError(
      `RepoCreate: Data must be a hex string of at most ${MAX_REPO_DATA_BYTES} bytes`,
    )
  }
}
