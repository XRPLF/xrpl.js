import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAmount,
  isMPTokenIssuanceID,
  isPositiveAmount,
  validateBaseTransaction,
  validateFlagsMask,
  validateNonZeroField,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values of {@link CouponClaim} transaction flags.
 *
 * @category Transaction Flags
 */
export enum CouponClaimFlags {
  /** Give up the holder's whole accrual instead of receiving it. */
  tfCouponForfeit = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link CouponClaim}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface CouponClaimFlagsInterface extends GlobalFlagsInterface {
  tfCouponForfeit?: boolean
}

/**
 * The CouponClaim transaction delivers a holder's settled coupons from the
 * schedule's pool, or forfeits them.
 *
 * @category Transaction Models
 */
export interface CouponClaim extends BaseTransaction {
  TransactionType: 'CouponClaim'
  Flags?: number | CouponClaimFlagsInterface
  /** The bond MPT issuance whose coupons are claimed. */
  MPTokenIssuanceID: string
  /**
   * The amount of the coupon asset to claim. Omitted to claim the whole
   * accrual; must be omitted on a forfeit.
   */
  Amount?: Amount | MPTAmount
}

/**
 * Verify the form and type of a CouponClaim at runtime.
 *
 * @param tx - A CouponClaim Transaction.
 * @throws When the CouponClaim is malformed.
 */
export function validateCouponClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx, CouponClaimFlags)
  validateRequiredField(tx, 'MPTokenIssuanceID', isMPTokenIssuanceID)
  validateNonZeroField(tx, 'MPTokenIssuanceID')
  validateOptionalField(tx, 'Amount', isAmount)
  if (tx.Amount === undefined) {
    return
  }
  if (!isPositiveAmount(tx.Amount)) {
    throw new ValidationError('CouponClaim: Amount must be positive')
  }
  if (hasFlag(tx, CouponClaimFlags.tfCouponForfeit, 'tfCouponForfeit')) {
    throw new ValidationError('CouponClaim: a forfeit must not set Amount')
  }
}
