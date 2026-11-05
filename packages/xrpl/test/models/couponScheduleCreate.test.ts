import { CouponScheduleCreate } from '../../src/models/transactions'
import { validateCouponScheduleCreate } from '../../src/models/transactions/couponScheduleCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateCouponScheduleCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCouponScheduleCreate, message)

const BOND_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
const SETTLEMENT_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'
const ISSUER = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'

/**
 * CouponScheduleCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CouponScheduleCreate', function () {
  let tx: CouponScheduleCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'CouponScheduleCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MPTokenIssuanceID: BOND_ID,
      CouponAsset: { currency: 'USD', issuer: ISSUER },
    }
  })

  describe('valid transactions', function () {
    it('verifies valid ad hoc CouponScheduleCreate', function () {
      assertValid(tx)
    })

    it('verifies valid CouponScheduleCreate with declared terms', function () {
      tx.CouponAmount = { currency: 'USD', issuer: ISSUER, value: '2.5' }
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 800000000
      tx.Expiration = 900000000
      tx.CallNoticePeriod = 604800
      tx.EarliestCallTime = 850000000
      assertValid(tx)
    })

    it('verifies valid CouponScheduleCreate with an XRP coupon', function () {
      tx.CouponAsset = { currency: 'XRP' }
      tx.CouponAmount = '1000'
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 800000000
      assertValid(tx)
    })

    it('verifies valid CouponScheduleCreate with an MPT coupon', function () {
      tx.CouponAsset = { mpt_issuance_id: SETTLEMENT_MPT_ID }
      tx.CouponAmount = { mpt_issuance_id: SETTLEMENT_MPT_ID, value: '10' }
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 800000000
      assertValid(tx)
    })

    it('verifies valid callable perpetual CouponScheduleCreate', function () {
      tx.CallNoticePeriod = 604800
      tx.EarliestCallTime = 850000000
      assertValid(tx)
    })
  })

  describe('field types', function () {
    it('throws w/ unknown flags', function () {
      tx.Flags = 0x00010000
      assertInvalid(tx, 'CouponScheduleCreate: invalid Flags')
    })

    it('throws w/ missing MPTokenIssuanceID', function () {
      // @ts-expect-error for test
      tx.MPTokenIssuanceID = undefined
      assertInvalid(tx, 'CouponScheduleCreate: missing field MPTokenIssuanceID')
    })

    it('throws w/ invalid MPTokenIssuanceID', function () {
      tx.MPTokenIssuanceID = 'ABCD'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field MPTokenIssuanceID')
    })

    it('throws w/ a zero MPTokenIssuanceID', function () {
      tx.MPTokenIssuanceID = '0'.repeat(48)
      assertInvalid(
        tx,
        'CouponScheduleCreate: MPTokenIssuanceID must not be zero',
      )
    })

    it('throws w/ missing CouponAsset', function () {
      // @ts-expect-error for test
      tx.CouponAsset = undefined
      assertInvalid(tx, 'CouponScheduleCreate: missing field CouponAsset')
    })

    it('throws w/ invalid CouponAsset', function () {
      // @ts-expect-error for test
      tx.CouponAsset = 'USD'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field CouponAsset')
    })

    it('throws w/ the bond issuance as its own CouponAsset', function () {
      tx.CouponAsset = { mpt_issuance_id: BOND_ID }
      assertInvalid(
        tx,
        'CouponScheduleCreate: CouponAsset must not be the MPTokenIssuanceID',
      )
    })

    it('throws w/ invalid CouponAmount', function () {
      tx.CouponAmount = 1000 as any
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 800000000
      assertInvalid(tx, 'CouponScheduleCreate: invalid field CouponAmount')
    })

    it('throws w/ invalid CouponInterval', function () {
      // @ts-expect-error for test
      tx.CouponInterval = '2592000'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field CouponInterval')
    })

    it('throws w/ invalid FirstCouponTime', function () {
      // @ts-expect-error for test
      tx.FirstCouponTime = '800000000'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field FirstCouponTime')
    })

    it('throws w/ invalid Expiration', function () {
      // @ts-expect-error for test
      tx.Expiration = '900000000'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field Expiration')
    })

    it('throws w/ invalid CallNoticePeriod', function () {
      // @ts-expect-error for test
      tx.CallNoticePeriod = '604800'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field CallNoticePeriod')
    })

    it('throws w/ invalid EarliestCallTime', function () {
      // @ts-expect-error for test
      tx.EarliestCallTime = '850000000'
      assertInvalid(tx, 'CouponScheduleCreate: invalid field EarliestCallTime')
    })
  })

  describe('declared and call terms', function () {
    it('throws w/ only some of the declared terms', function () {
      const message =
        'CouponScheduleCreate: CouponAmount, CouponInterval and FirstCouponTime must be set together'
      tx.CouponAmount = '1000'
      assertInvalid(tx, message)
      tx.CouponInterval = 2592000
      assertInvalid(tx, message)
      delete tx.CouponAmount
      tx.FirstCouponTime = 800000000
      assertInvalid(tx, message)
    })

    it('throws w/ a zero or negative CouponAmount', function () {
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 800000000
      tx.CouponAmount = '0'
      assertInvalid(tx, 'CouponScheduleCreate: CouponAmount must be positive')
      tx.CouponAmount = { currency: 'USD', issuer: ISSUER, value: '-1' }
      assertInvalid(tx, 'CouponScheduleCreate: CouponAmount must be positive')
    })

    it('throws w/ a zero CouponInterval', function () {
      tx.CouponAmount = '1000'
      tx.CouponInterval = 0
      tx.FirstCouponTime = 800000000
      assertInvalid(
        tx,
        'CouponScheduleCreate: CouponInterval and FirstCouponTime must not be zero',
      )
    })

    it('throws w/ a zero FirstCouponTime', function () {
      tx.CouponAmount = '1000'
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 0
      assertInvalid(
        tx,
        'CouponScheduleCreate: CouponInterval and FirstCouponTime must not be zero',
      )
    })

    it('throws w/ Expiration not after FirstCouponTime', function () {
      tx.CouponAmount = '1000'
      tx.CouponInterval = 2592000
      tx.FirstCouponTime = 800000000
      tx.Expiration = 800000000
      assertInvalid(
        tx,
        'CouponScheduleCreate: Expiration must be after FirstCouponTime',
      )
    })

    it('throws w/ a zero CallNoticePeriod', function () {
      tx.CallNoticePeriod = 0
      assertInvalid(
        tx,
        'CouponScheduleCreate: CallNoticePeriod must not be zero',
      )
    })

    it('throws w/ EarliestCallTime on a non-callable schedule', function () {
      tx.EarliestCallTime = 850000000
      assertInvalid(
        tx,
        'CouponScheduleCreate: EarliestCallTime requires a non-zero value and CallNoticePeriod',
      )
    })

    it('throws w/ a zero EarliestCallTime', function () {
      tx.CallNoticePeriod = 604800
      tx.EarliestCallTime = 0
      assertInvalid(
        tx,
        'CouponScheduleCreate: EarliestCallTime requires a non-zero value and CallNoticePeriod',
      )
    })

    it('throws w/ EarliestCallTime not before Expiration', function () {
      tx.CallNoticePeriod = 604800
      tx.EarliestCallTime = 900000000
      tx.Expiration = 900000000
      assertInvalid(
        tx,
        'CouponScheduleCreate: EarliestCallTime must be before Expiration',
      )
    })
  })
})
