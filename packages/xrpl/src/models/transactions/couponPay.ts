import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isMPTokenIssuanceID,
  isPositiveAmount,
  validateBaseTransaction,
  validateFlagsMask,
  validateNonZeroField,
  validateRequiredField,
} from './common'

/**
 * The CouponPay transaction declares a coupon on a bond MPT issuance: it
 * moves the coupon amount from the payer's spendable balance into the
 * schedule's pool and advances the per-unit accrual.
 *
 * @category Transaction Models
 */
export interface CouponPay extends BaseTransaction {
  TransactionType: 'CouponPay'
  /** The bond MPT issuance the coupon is declared on. */
  MPTokenIssuanceID: string
  /** The coupon paid per unit of the bond, in the schedule's coupon asset. */
  Amount: Amount | MPTAmount
}

/**
 * Verify the form and type of a CouponPay at runtime.
 *
 * @param tx - A CouponPay Transaction.
 * @throws When the CouponPay is malformed.
 */
export function validateCouponPay(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isMPTokenIssuanceID)
  validateNonZeroField(tx, 'MPTokenIssuanceID')
  validateRequiredField(tx, 'Amount', isAmount)
  if (!isPositiveAmount(tx.Amount)) {
    throw new ValidationError('CouponPay: Amount must be positive')
  }
}
