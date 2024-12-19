import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { AuthorizeCredential, validate, ValidationError } from '../../src'
import { validateDepositPreauth } from '../../src/models/transactions/depositPreauth'

/**
 * DepositPreauth Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DepositPreauth', function () {
  let depositPreauth

  const validCredential = {
    Credential: {
      Issuer: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      CredentialType: stringToHex('Passport'),
    },
  }

  beforeEach(function () {
    depositPreauth = {
      TransactionType: 'DepositPreauth',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
    } as any
  })

  it('verifies valid DepositPreauth when only Authorize is provided', function () {
    depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
    assert.doesNotThrow(() => validateDepositPreauth(depositPreauth))
    assert.doesNotThrow(() => validate(depositPreauth))
  })

  it('verifies valid DepositPreauth when only Unauthorize is provided', function () {
    depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
    assert.doesNotThrow(() => validateDepositPreauth(depositPreauth))
    assert.doesNotThrow(() => validate(depositPreauth))
  })

  it('verifies valid DepositPreauth when only AuthorizeCredentials is provided', function () {
    depositPreauth.AuthorizeCredentials = [validCredential]
    assert.doesNotThrow(() => validateDepositPreauth(depositPreauth))
    assert.doesNotThrow(() => validate(depositPreauth))
  })

  it('verifies valid DepositPreauth when only UnauthorizeCredentials is provided', function () {
    depositPreauth.UnauthorizeCredentials = [validCredential]
    assert.doesNotThrow(() => validateDepositPreauth(depositPreauth))
    assert.doesNotThrow(() => validate(depositPreauth))
  })

  it('throws when multiple of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials are provided', function () {
    const errorMessage =
      'DepositPreauth: Requires exactly one field of the following: Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.'

    depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
    depositPreauth.UnauthorizeCredentials = [validCredential]
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)

    depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)

    depositPreauth.AuthorizeCredentials = [validCredential]
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)

    depositPreauth.Authorize = undefined
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)

    depositPreauth.UnauthorizeCredentials = undefined
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when none of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials are provided', function () {
    const errorMessage =
      'DepositPreauth: Requires exactly one field of the following: Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.'
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when Authorize is not a string', function () {
    depositPreauth.Authorize = 1234
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      'DepositPreauth: Authorize must be a string',
    )
    assert.throws(
      () => validate(depositPreauth),
      ValidationError,
      'DepositPreauth: Authorize must be a string',
    )
  })

  it('throws when an Account attempts to preauthorize its own address', function () {
    depositPreauth.Authorize = depositPreauth.Account
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      "DepositPreauth: Account can't preauthorize its own address",
    )
  })

  it('throws when Unauthorize is not a string', function () {
    depositPreauth.Unauthorize = 1234
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      'DepositPreauth: Unauthorize must be a string',
    )
    assert.throws(
      () => validate(depositPreauth),
      ValidationError,
      'DepositPreauth: Unauthorize must be a string',
    )
  })

  it('throws when an Account attempts to unauthorize its own address', function () {
    depositPreauth.Unauthorize = depositPreauth.Account
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      "DepositPreauth: Account can't unauthorize its own address",
    )
    assert.throws(
      () => validate(depositPreauth),
      ValidationError,
      "DepositPreauth: Account can't unauthorize its own address",
    )
  })

  it('throws when AuthorizeCredentials is not an array', function () {
    const errorMessage = 'DepositPreauth: Credentials must be an array'
    depositPreauth.AuthorizeCredentials = validCredential

    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when UnauthorizeCredentials is not an array', function () {
    const errorMessage = 'DepositPreauth: Credentials must be an array'
    depositPreauth.UnauthorizeCredentials = validCredential

    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when AuthorizeCredentials is empty array', function () {
    const errorMessage = 'DepositPreauth: Credentials cannot be an empty array'
    depositPreauth.AuthorizeCredentials = []

    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when UnauthorizeCredentials is empty array', function () {
    const errorMessage = 'DepositPreauth: Credentials cannot be an empty array'
    depositPreauth.UnauthorizeCredentials = []

    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when AuthorizeCredentials is too long', function () {
    const sampleCredentials: AuthorizeCredential[] = []
    const errorMessage =
      'DepositPreauth: Credentials length cannot exceed 8 elements'
    for (let index = 0; index < 9; index++) {
      sampleCredentials.push({
        Credential: {
          Issuer: `SampleIssuer${index}`,
          CredentialType: stringToHex('Passport'),
        },
      })
    }
    depositPreauth.AuthorizeCredentials = sampleCredentials
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when UnauthorizeCredentials is too long', function () {
    const sampleCredentials: AuthorizeCredential[] = []
    const errorMessage =
      'DepositPreauth: Credentials length cannot exceed 8 elements'
    for (let index = 0; index < 9; index++) {
      sampleCredentials.push({
        Credential: {
          Issuer: `SampleIssuer${index}`,
          CredentialType: stringToHex('Passport'),
        },
      })
    }
    depositPreauth.UnauthorizeCredentials = sampleCredentials
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when AuthorizeCredentials is invalid shape', function () {
    const invalidCredentials = [
      { Credential: 'Invalid Shape' },
      { Credential: 'Another Invalid Shape' },
    ]
    const errorMessage = 'DepositPreauth: Invalid Credentials format'

    depositPreauth.AuthorizeCredentials = invalidCredentials
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when UnauthorizeCredentials is invalid shape', function () {
    const invalidCredentials = [
      { Credential: 'Invalid Shape' },
      { Credential: 'Another Invalid Shape' },
    ]
    const errorMessage = 'DepositPreauth: Invalid Credentials format'

    depositPreauth.UnauthorizeCredentials = invalidCredentials
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when AuthorizeCredentials has duplicates', function () {
    const invalidCredentials = [validCredential, validCredential]
    const errorMessage =
      'DepositPreauth: Credentials cannot contain duplicate elements'

    depositPreauth.AuthorizeCredentials = invalidCredentials
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })

  it('throws when UnauthorizeCredentials has duplicates', function () {
    const invalidCredentials = [validCredential, validCredential]
    const errorMessage =
      'DepositPreauth: Credentials cannot contain duplicate elements'

    depositPreauth.UnauthorizeCredentials = invalidCredentials
    assert.throws(
      () => validateDepositPreauth(depositPreauth),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(depositPreauth), ValidationError, errorMessage)
  })
})
