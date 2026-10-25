import { Amount, Currency, MPTAmount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The CouponSchedule object type represents a bond MPT issuance's coupon
 * schedule: the payer's standing offer of coupon payments per unit of the
 * bond, settled in a coupon asset. There is one schedule per issuance.
 *
 * @category Ledger Entries
 */
export default interface CouponSchedule
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'CouponSchedule'
  /** A bit-map of boolean flags. No flags are defined for CouponSchedule. */
  Flags: number
  /**
   * A hint indicating which page of the owner's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /** The account that administers the schedule. */
  Owner: string
  /** The payer: the bond issuance's issuer. */
  Account: string
  /** The bond MPT issuance the schedule pays coupons on. */
  MPTokenIssuanceID: string
  /** The asset (XRP, IOU or MPT) coupons are paid in. */
  CouponAsset: Currency
  /** The cumulative coupon declared per unit of the bond. Absent when zero. */
  AccruedPerUnit?: Amount | MPTAmount
  /** The coupon asset held for unclaimed coupons. Absent when zero. */
  PoolAmount?: Amount | MPTAmount
  /** The number of holders with a non-zero unclaimed accrual. Absent when zero. */
  ClaimantCount?: number
  /** The number of coupons declared. Absent when zero. */
  CouponCount?: number
  /** The time, in seconds since the Ripple Epoch, of the last declared coupon. */
  LastCouponTime?: number
  /** The coupon paid per unit of the bond at each declared coupon date. */
  CouponAmount?: Amount | MPTAmount
  /** The time, in seconds, between declared coupon dates. */
  CouponInterval?: number
  /** The first declared coupon date, in seconds since the Ripple Epoch. */
  FirstCouponTime?: number
  /** The time, in seconds since the Ripple Epoch, the schedule ends. */
  Expiration?: number
  /** The minimum notice, in seconds, before the bond can be called. */
  CallNoticePeriod?: number
  /** The earliest Expiration, in seconds since the Ripple Epoch, a call may set. */
  EarliestCallTime?: number
  /**
   * The coupon asset's transfer rate when the schedule was created, when it
   * is not parity. Claims pay the lower of this and the current rate.
   */
  TransferRate?: number
}
