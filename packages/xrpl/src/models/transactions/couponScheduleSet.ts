import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isMPTokenIssuanceID,
  isNumber,
  validateBaseTransaction,
  validateFlagsMask,
  validateNonZeroField,
  validateRequiredField,
} from './common'

/**
 * The CouponScheduleSet transaction exercises the issuer's call option on a
 * callable coupon schedule by shortening its Expiration.
 *
 * @category Transaction Models
 */
export interface CouponScheduleSet extends BaseTransaction {
  TransactionType: 'CouponScheduleSet'
  /** The bond MPT issuance whose schedule is called. */
  MPTokenIssuanceID: string
  /** The new Expiration, in seconds since the Ripple Epoch. */
  Expiration: number
}

/**
 * Verify the form and type of a CouponScheduleSet at runtime.
 *
 * @param tx - A CouponScheduleSet Transaction.
 * @throws When the CouponScheduleSet is malformed.
 */
export function validateCouponScheduleSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isMPTokenIssuanceID)
  validateNonZeroField(tx, 'MPTokenIssuanceID')
  validateRequiredField(tx, 'Expiration', isNumber)
  if (tx.Expiration === 0) {
    throw new ValidationError('CouponScheduleSet: Expiration must not be zero')
  }
}
