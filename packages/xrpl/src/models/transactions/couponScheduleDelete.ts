import {
  BaseTransaction,
  isMPTokenIssuanceID,
  validateBaseTransaction,
  validateFlagsMask,
  validateNonZeroField,
  validateRequiredField,
} from './common'

/**
 * The CouponScheduleDelete transaction deletes the coupon schedule of a bond
 * MPT issuance that has no outstanding units and no unsettled claimants.
 *
 * @category Transaction Models
 */
export interface CouponScheduleDelete extends BaseTransaction {
  TransactionType: 'CouponScheduleDelete'
  /** The bond MPT issuance whose schedule is deleted. */
  MPTokenIssuanceID: string
}

/**
 * Verify the form and type of a CouponScheduleDelete at runtime.
 *
 * @param tx - A CouponScheduleDelete Transaction.
 * @throws When the CouponScheduleDelete is malformed.
 */
export function validateCouponScheduleDelete(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isMPTokenIssuanceID)
  validateNonZeroField(tx, 'MPTokenIssuanceID')
}
