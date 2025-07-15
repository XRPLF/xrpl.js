import { validateTrustSet } from '../../src/models/transactions/trustSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateTrustSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTrustSet, message)

/**
 * TrustSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TrustSet', function () {
  let trustSet: any

  beforeEach(function () {
    trustSet = {
      TransactionType: 'TrustSet',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      LimitAmount: {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '4329.23',
      },
      QualityIn: 1234,
      QualityOut: 4321,
      // an example of deep-frozen trustline
      Flags: {
        tfSetFreeze: true,
        tfSetDeepFreeze: true,
      },
    }
  })

  it('verifies valid TrustSet', function () {
    assertValid(trustSet)
  })

  it('throws when LimitAmount is missing', function () {
    delete trustSet.LimitAmount
    assertInvalid(trustSet, 'TrustSet: missing field LimitAmount')
  })

  it('throws when LimitAmount is invalid', function () {
    trustSet.LimitAmount = 1234
    assertInvalid(trustSet, 'TrustSet: invalid LimitAmount')
  })

  it('throws when QualityIn is not a number', function () {
    trustSet.QualityIn = '1234'
    assertInvalid(trustSet, 'TrustSet: QualityIn must be a number')
  })

  it('throws when QualityOut is not a number', function () {
    trustSet.QualityOut = '4321'
    assertInvalid(trustSet, 'TrustSet: QualityOut must be a number')
  })
})
