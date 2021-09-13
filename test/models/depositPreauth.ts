import { ValidationError } from 'xrpl-local/common/errors'
import { verifyDepositPreauth } from './../../src/models/transactions/depositPreauth'
import { assert } from 'chai'
import { verify } from '../../src/models/transactions'

/**
 * DepositPreauth Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DepositPreauth', function () {
  let depositPreauth

  beforeEach(function () {
    depositPreauth = {
      TransactionType: 'DepositPreauth',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
    } as any
  })

  it('verifies valid DepositPreauth when only Authorize is provided', function () {
    depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
    assert.doesNotThrow(() => verifyDepositPreauth(depositPreauth))
    assert.doesNotThrow(() => verify(depositPreauth))
  })

  it('verifies valid DepositPreauth when only Unauthorize is provided', function () {
    depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
    assert.doesNotThrow(() => verifyDepositPreauth(depositPreauth))
    assert.doesNotThrow(() => verify(depositPreauth))
  })

  it('throws when both Authorize and Unauthorize are provided', function () {
    depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
    depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
    assert.throws(
      () => verifyDepositPreauth(depositPreauth),
      ValidationError,
      "DepositPreauth: can't provide both Authorize and Unauthorize fields",
    )
    assert.throws(
      () => verify(depositPreauth),
      ValidationError,
      "DepositPreauth: can't provide both Authorize and Unauthorize fields",
    )
  })

  it('throws when neither Authorize nor Unauthorize are provided', function () {
    assert.throws(
      () => verifyDepositPreauth(depositPreauth),
      ValidationError,
      'DepositPreauth: must provide either Authorize or Unauthorize field',
    )
    assert.throws(
      () => verify(depositPreauth),
      ValidationError,
      'DepositPreauth: must provide either Authorize or Unauthorize field',
    )
  })

  it('throws when Authorize is not a string', function () {
    depositPreauth.Authorize = 1234
    assert.throws(
      () => verifyDepositPreauth(depositPreauth),
      ValidationError,
      'DepositPreauth: Authorize must be a string',
    )
    assert.throws(
      () => verify(depositPreauth),
      ValidationError,
      'DepositPreauth: Authorize must be a string',
    )
  })

  it('throws when an Account attempts to preauthorize its own address', function () {
    depositPreauth.Authorize = depositPreauth.Account
    assert.throws(
      () => verifyDepositPreauth(depositPreauth),
      ValidationError,
      "DepositPreauth: Account can't preauthorize its own address",
    )
  })

  it('throws when Unauthorize is not a string', function () {
    depositPreauth.Unauthorize = 1234
    assert.throws(
      () => verifyDepositPreauth(depositPreauth),
      ValidationError,
      'DepositPreauth: Unauthorize must be a string',
    )
    assert.throws(
      () => verify(depositPreauth),
      ValidationError,
      'DepositPreauth: Unauthorize must be a string',
    )
  })

  it('throws when an Account attempts to unauthorize its own address', function () {
    depositPreauth.Unauthorize = depositPreauth.Account
    assert.throws(
      () => verifyDepositPreauth(depositPreauth),
      ValidationError,
      "DepositPreauth: Account can't unauthorize its own address",
    )
    assert.throws(
      () => verify(depositPreauth),
      ValidationError,
      "DepositPreauth: Account can't unauthorize its own address",
    )
  })
})
