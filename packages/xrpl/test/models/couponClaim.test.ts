import { CouponClaim, CouponClaimFlags } from '../../src/models/transactions'
import { validateCouponClaim } from '../../src/models/transactions/couponClaim'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateCouponClaim)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCouponClaim, message)

const SETTLEMENT_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'

/**
 * CouponClaim Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CouponClaim', function () {
  let tx: CouponClaim

  beforeEach(function () {
    tx = {
      TransactionType: 'CouponClaim',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MPTokenIssuanceID: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
    }
  })

  it('verifies valid CouponClaim of the whole accrual', function () {
    assertValid(tx)
  })

  it('verifies valid CouponClaim with an Amount', function () {
    tx.Amount = '1000'
    assertValid(tx)
    tx.Amount = {
      currency: 'USD',
      issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      value: '2.5',
    }
    assertValid(tx)
    tx.Amount = { mpt_issuance_id: SETTLEMENT_MPT_ID, value: '10' }
    assertValid(tx)
  })

  it('verifies valid forfeit CouponClaim', function () {
    tx.Flags = CouponClaimFlags.tfCouponForfeit
    assertValid(tx)
    tx.Flags = { tfCouponForfeit: true }
    assertValid(tx)
  })

  it('throws w/ unknown flags', function () {
    tx.Flags = 0x00020000
    assertInvalid(tx, 'CouponClaim: invalid Flags')
  })

  it('throws w/ missing MPTokenIssuanceID', function () {
    // @ts-expect-error for test
    tx.MPTokenIssuanceID = undefined
    assertInvalid(tx, 'CouponClaim: missing field MPTokenIssuanceID')
  })

  it('throws w/ invalid MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = 'ABCD'
    assertInvalid(tx, 'CouponClaim: invalid field MPTokenIssuanceID')
  })

  it('throws w/ a zero MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = '0'.repeat(48)
    assertInvalid(tx, 'CouponClaim: MPTokenIssuanceID must not be zero')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = 1000 as any
    assertInvalid(tx, 'CouponClaim: invalid field Amount')
  })

  it('throws w/ a zero or negative Amount', function () {
    tx.Amount = '0'
    assertInvalid(tx, 'CouponClaim: Amount must be positive')
    tx.Amount = { mpt_issuance_id: SETTLEMENT_MPT_ID, value: '-5' }
    assertInvalid(tx, 'CouponClaim: Amount must be positive')
  })

  it('throws w/ an Amount on a forfeit', function () {
    tx.Flags = CouponClaimFlags.tfCouponForfeit
    tx.Amount = '1000'
    assertInvalid(tx, 'CouponClaim: a forfeit must not set Amount')
  })
})
