import { ValidationError } from '../../errors'
import { Amount, Currency, MPTAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isCurrency,
  isMPTokenIssuanceID,
  isNumber,
  isPositiveAmount,
  validateBaseTransaction,
  validateFlagsMask,
  validateNonZeroField,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The CouponScheduleCreate transaction creates the coupon schedule of a bond
 * MPT issuance: the issuer's standing offer of coupon payments per unit of
 * the bond, settled in a coupon asset. A schedule either declares a coupon
 * date grid (CouponAmount, CouponInterval and FirstCouponTime together) or
 * distributes ad hoc.
 *
 * @category Transaction Models
 */
export interface CouponScheduleCreate extends BaseTransaction {
  TransactionType: 'CouponScheduleCreate'
  /** The bond MPT issuance the schedule pays coupons on. */
  MPTokenIssuanceID: string
  /** The asset (XRP, IOU or MPT) coupons are paid in. */
  CouponAsset: Currency
  /** The coupon paid per unit of the bond at each declared coupon date. */
  CouponAmount?: Amount | MPTAmount
  /** The time, in seconds, between declared coupon dates. */
  CouponInterval?: number
  /** The first declared coupon date, in seconds since the Ripple Epoch. */
  FirstCouponTime?: number
  /** The time, in seconds since the Ripple Epoch, the schedule ends. */
  Expiration?: number
  /**
   * The minimum notice, in seconds, the issuer gives before calling the bond.
   * Its presence makes the schedule callable.
   */
  CallNoticePeriod?: number
  /**
   * The earliest Expiration, in seconds since the Ripple Epoch, a call may
   * set. Requires CallNoticePeriod.
   */
  EarliestCallTime?: number
}

/**
 * The coupon asset is not the bond issuance itself.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if CouponAsset names MPTokenIssuanceID.
 */
function validateCouponAsset(tx: Record<string, unknown>): void {
  validateRequiredField(tx, 'CouponAsset', isCurrency)
  const asset = tx.CouponAsset
  if (
    'mpt_issuance_id' in asset &&
    typeof tx.MPTokenIssuanceID === 'string' &&
    asset.mpt_issuance_id.toUpperCase() === tx.MPTokenIssuanceID.toUpperCase()
  ) {
    throw new ValidationError(
      'CouponScheduleCreate: CouponAsset must not be the MPTokenIssuanceID',
    )
  }
}

/**
 * CouponAmount, CouponInterval and FirstCouponTime are set together, with a
 * positive amount and non-zero times, and Expiration follows FirstCouponTime.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if the declared terms are malformed.
 */
function validateDeclaredTerms(tx: Record<string, unknown>): void {
  const hasAmount = tx.CouponAmount !== undefined
  if (
    hasAmount !== (tx.CouponInterval !== undefined) ||
    hasAmount !== (tx.FirstCouponTime !== undefined)
  ) {
    throw new ValidationError(
      'CouponScheduleCreate: CouponAmount, CouponInterval and FirstCouponTime must be set together',
    )
  }
  if (!hasAmount) {
    return
  }
  if (!isPositiveAmount(tx.CouponAmount)) {
    throw new ValidationError(
      'CouponScheduleCreate: CouponAmount must be positive',
    )
  }
  if (tx.CouponInterval === 0 || tx.FirstCouponTime === 0) {
    throw new ValidationError(
      'CouponScheduleCreate: CouponInterval and FirstCouponTime must not be zero',
    )
  }
  if (
    typeof tx.Expiration === 'number' &&
    typeof tx.FirstCouponTime === 'number' &&
    tx.Expiration <= tx.FirstCouponTime
  ) {
    throw new ValidationError(
      'CouponScheduleCreate: Expiration must be after FirstCouponTime',
    )
  }
}

/**
 * CallNoticePeriod is non-zero, and EarliestCallTime is non-zero, needs
 * CallNoticePeriod and precedes Expiration.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if the call terms are malformed.
 */
function validateCallTerms(tx: Record<string, unknown>): void {
  if (tx.CallNoticePeriod === 0) {
    throw new ValidationError(
      'CouponScheduleCreate: CallNoticePeriod must not be zero',
    )
  }
  if (tx.EarliestCallTime === undefined) {
    return
  }
  if (tx.CallNoticePeriod === undefined || tx.EarliestCallTime === 0) {
    throw new ValidationError(
      'CouponScheduleCreate: EarliestCallTime requires a non-zero value and CallNoticePeriod',
    )
  }
  if (
    typeof tx.Expiration === 'number' &&
    typeof tx.EarliestCallTime === 'number' &&
    tx.EarliestCallTime >= tx.Expiration
  ) {
    throw new ValidationError(
      'CouponScheduleCreate: EarliestCallTime must be before Expiration',
    )
  }
}

/**
 * Verify the form and type of a CouponScheduleCreate at runtime.
 *
 * @param tx - A CouponScheduleCreate Transaction.
 * @throws When the CouponScheduleCreate is malformed.
 */
export function validateCouponScheduleCreate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isMPTokenIssuanceID)
  validateNonZeroField(tx, 'MPTokenIssuanceID')
  validateCouponAsset(tx)
  validateOptionalField(tx, 'CouponAmount', isAmount)
  validateOptionalField(tx, 'CouponInterval', isNumber)
  validateOptionalField(tx, 'FirstCouponTime', isNumber)
  validateOptionalField(tx, 'Expiration', isNumber)
  validateOptionalField(tx, 'CallNoticePeriod', isNumber)
  validateOptionalField(tx, 'EarliestCallTime', isNumber)
  validateDeclaredTerms(tx)
  validateCallTerms(tx)
}
