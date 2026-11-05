import { CouponScheduleSet } from '../../src/models/transactions'
import { validateCouponScheduleSet } from '../../src/models/transactions/couponScheduleSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateCouponScheduleSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCouponScheduleSet, message)

/**
 * CouponScheduleSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CouponScheduleSet', function () {
  let tx: CouponScheduleSet

  beforeEach(function () {
    tx = {
      TransactionType: 'CouponScheduleSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MPTokenIssuanceID: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      Expiration: 900000000,
    }
  })

  it('verifies valid CouponScheduleSet', function () {
    assertValid(tx)
  })

  it('throws w/ unknown flags', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'CouponScheduleSet: invalid Flags')
  })

  it('throws w/ missing MPTokenIssuanceID', function () {
    // @ts-expect-error for test
    tx.MPTokenIssuanceID = undefined
    assertInvalid(tx, 'CouponScheduleSet: missing field MPTokenIssuanceID')
  })

  it('throws w/ invalid MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = 'ABCD'
    assertInvalid(tx, 'CouponScheduleSet: invalid field MPTokenIssuanceID')
  })

  it('throws w/ a zero MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = '0'.repeat(48)
    assertInvalid(tx, 'CouponScheduleSet: MPTokenIssuanceID must not be zero')
  })

  it('throws w/ missing Expiration', function () {
    // @ts-expect-error for test
    tx.Expiration = undefined
    assertInvalid(tx, 'CouponScheduleSet: missing field Expiration')
  })

  it('throws w/ invalid Expiration', function () {
    // @ts-expect-error for test
    tx.Expiration = '900000000'
    assertInvalid(tx, 'CouponScheduleSet: invalid field Expiration')
  })

  it('throws w/ a zero Expiration', function () {
    tx.Expiration = 0
    assertInvalid(tx, 'CouponScheduleSet: Expiration must not be zero')
  })
})
