import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateTrustSet } from '../../src/models/transactions/trustSet'

/**
 * TrustSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TrustSet', function () {
  let trustSet

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
    } as any
  })

  it('verifies valid TrustSet', function () {
    assert.doesNotThrow(() => validateTrustSet(trustSet))
    assert.doesNotThrow(() => validate(trustSet))
  })

  it('throws when LimitAmount is missing', function () {
    delete trustSet.LimitAmount
    assert.throws(
      () => validateTrustSet(trustSet),
      ValidationError,
      'TrustSet: missing field LimitAmount',
    )
    assert.throws(
      () => validate(trustSet),
      ValidationError,
      'TrustSet: missing field LimitAmount',
    )
  })

  it('throws when LimitAmount is invalid', function () {
    trustSet.LimitAmount = 1234
    assert.throws(
      () => validateTrustSet(trustSet),
      ValidationError,
      'TrustSet: invalid LimitAmount',
    )
    assert.throws(
      () => validate(trustSet),
      ValidationError,
      'TrustSet: invalid LimitAmount',
    )
  })

  it('throws when QualityIn is not a number', function () {
    trustSet.QualityIn = '1234'
    assert.throws(
      () => validateTrustSet(trustSet),
      ValidationError,
      'TrustSet: QualityIn must be a number',
    )
    assert.throws(
      () => validate(trustSet),
      ValidationError,
      'TrustSet: QualityIn must be a number',
    )
  })

  it('throws when QualityOut is not a number', function () {
    trustSet.QualityOut = '4321'
    assert.throws(
      () => validateTrustSet(trustSet),
      ValidationError,
      'TrustSet: QualityOut must be a number',
    )
    assert.throws(
      () => validate(trustSet),
      ValidationError,
      'TrustSet: QualityOut must be a number',
    )
  })
})
