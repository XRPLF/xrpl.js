import { CouponPay } from '../../src/models/transactions'
import { validateCouponPay } from '../../src/models/transactions/couponPay'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateCouponPay)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCouponPay, message)

const SETTLEMENT_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'

/**
 * CouponPay Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CouponPay', function () {
  let tx: CouponPay

  beforeEach(function () {
    tx = {
      TransactionType: 'CouponPay',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MPTokenIssuanceID: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      Amount: '1000',
    }
  })

  it('verifies valid CouponPay', function () {
    assertValid(tx)
  })

  it('verifies valid CouponPay with token amounts', function () {
    tx.Amount = {
      currency: 'USD',
      issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      value: '0.01',
    }
    assertValid(tx)
    tx.Amount = { mpt_issuance_id: SETTLEMENT_MPT_ID, value: '10' }
    assertValid(tx)
  })

  it('throws w/ unknown flags', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'CouponPay: invalid Flags')
  })

  it('throws w/ missing MPTokenIssuanceID', function () {
    // @ts-expect-error for test
    tx.MPTokenIssuanceID = undefined
    assertInvalid(tx, 'CouponPay: missing field MPTokenIssuanceID')
  })

  it('throws w/ invalid MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = 'ABCD'
    assertInvalid(tx, 'CouponPay: invalid field MPTokenIssuanceID')
  })

  it('throws w/ a zero MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = '0'.repeat(48)
    assertInvalid(tx, 'CouponPay: MPTokenIssuanceID must not be zero')
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    tx.Amount = undefined
    assertInvalid(tx, 'CouponPay: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = 1000 as any
    assertInvalid(tx, 'CouponPay: invalid field Amount')
  })

  it('throws w/ a zero or negative Amount', function () {
    tx.Amount = '0'
    assertInvalid(tx, 'CouponPay: Amount must be positive')
    tx.Amount = { mpt_issuance_id: SETTLEMENT_MPT_ID, value: '-5' }
    assertInvalid(tx, 'CouponPay: Amount must be positive')
  })
})
