import { CouponScheduleDelete } from '../../src/models/transactions'
import { validateCouponScheduleDelete } from '../../src/models/transactions/couponScheduleDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateCouponScheduleDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCouponScheduleDelete, message)

/**
 * CouponScheduleDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CouponScheduleDelete', function () {
  let tx: CouponScheduleDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'CouponScheduleDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MPTokenIssuanceID: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
    }
  })

  it('verifies valid CouponScheduleDelete', function () {
    assertValid(tx)
  })

  it('throws w/ unknown flags', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'CouponScheduleDelete: invalid Flags')
  })

  it('throws w/ missing MPTokenIssuanceID', function () {
    // @ts-expect-error for test
    tx.MPTokenIssuanceID = undefined
    assertInvalid(tx, 'CouponScheduleDelete: missing field MPTokenIssuanceID')
  })

  it('throws w/ invalid MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = 'ABCD'
    assertInvalid(tx, 'CouponScheduleDelete: invalid field MPTokenIssuanceID')
  })

  it('throws w/ a zero MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = '0'.repeat(48)
    assertInvalid(
      tx,
      'CouponScheduleDelete: MPTokenIssuanceID must not be zero',
    )
  })
})
