import { stringToHex } from '@xrplf/isomorphic/utils'

import { AuthorizeCredential } from '../../src'
import { validateDepositPreauth } from '../../src/models/transactions/depositPreauth'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateDepositPreauth)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateDepositPreauth, message)

/**
 * DepositPreauth Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DepositPreauth', function () {
  let depositPreauth: any

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
    assertValid(depositPreauth)
  })

  it('verifies valid DepositPreauth when only Unauthorize is provided', function () {
    depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
    assertValid(depositPreauth)
  })

  it('verifies valid DepositPreauth when only AuthorizeCredentials is provided', function () {
    depositPreauth.AuthorizeCredentials = [validCredential]
    assertValid(depositPreauth)
  })

  it('verifies valid DepositPreauth when only UnauthorizeCredentials is provided', function () {
    depositPreauth.UnauthorizeCredentials = [validCredential]
    assertValid(depositPreauth)
  })

  it('throws when multiple of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials are provided', function () {
    const errorMessage =
      'DepositPreauth: Requires exactly one field of the following: Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.'

    depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
    depositPreauth.UnauthorizeCredentials = [validCredential]
    assertInvalid(depositPreauth, errorMessage)

    depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
    assertInvalid(depositPreauth, errorMessage)

    depositPreauth.AuthorizeCredentials = [validCredential]
    assertInvalid(depositPreauth, errorMessage)

    depositPreauth.Authorize = undefined
    assertInvalid(depositPreauth, errorMessage)

    depositPreauth.UnauthorizeCredentials = undefined
    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when none of Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials are provided', function () {
    const errorMessage =
      'DepositPreauth: Requires exactly one field of the following: Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.'
    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when Authorize is not a string', function () {
    depositPreauth.Authorize = 1234
    assertInvalid(depositPreauth, 'DepositPreauth: Authorize must be a string')
  })

  it('throws when an Account attempts to preauthorize its own address', function () {
    depositPreauth.Authorize = depositPreauth.Account
    assertInvalid(
      depositPreauth,
      "DepositPreauth: Account can't preauthorize its own address",
    )
  })

  it('throws when Unauthorize is not a string', function () {
    depositPreauth.Unauthorize = 1234
    assertInvalid(
      depositPreauth,
      'DepositPreauth: Unauthorize must be a string',
    )
  })

  it('throws when an Account attempts to unauthorize its own address', function () {
    depositPreauth.Unauthorize = depositPreauth.Account
    assertInvalid(
      depositPreauth,
      "DepositPreauth: Account can't unauthorize its own address",
    )
  })

  it('throws when AuthorizeCredentials is not an array', function () {
    const errorMessage = 'DepositPreauth: Credentials must be an array'
    depositPreauth.AuthorizeCredentials = validCredential

    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when UnauthorizeCredentials is not an array', function () {
    const errorMessage = 'DepositPreauth: Credentials must be an array'
    depositPreauth.UnauthorizeCredentials = validCredential

    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when AuthorizeCredentials is empty array', function () {
    const errorMessage = 'DepositPreauth: Credentials cannot be an empty array'
    depositPreauth.AuthorizeCredentials = []

    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when UnauthorizeCredentials is empty array', function () {
    const errorMessage = 'DepositPreauth: Credentials cannot be an empty array'
    depositPreauth.UnauthorizeCredentials = []

    assertInvalid(depositPreauth, errorMessage)
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
    assertInvalid(depositPreauth, errorMessage)
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
    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when AuthorizeCredentials is invalid shape', function () {
    const invalidCredentials = [
      { Credential: 'Invalid Shape' },
      { Credential: 'Another Invalid Shape' },
    ]
    const errorMessage = 'DepositPreauth: Invalid Credentials format'

    depositPreauth.AuthorizeCredentials = invalidCredentials
    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when UnauthorizeCredentials is invalid shape', function () {
    const invalidCredentials = [
      { Credential: 'Invalid Shape' },
      { Credential: 'Another Invalid Shape' },
    ]
    const errorMessage = 'DepositPreauth: Invalid Credentials format'

    depositPreauth.UnauthorizeCredentials = invalidCredentials
    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when AuthorizeCredentials has duplicates', function () {
    const invalidCredentials = [validCredential, validCredential]
    const errorMessage =
      'DepositPreauth: Credentials cannot contain duplicate elements'

    depositPreauth.AuthorizeCredentials = invalidCredentials
    assertInvalid(depositPreauth, errorMessage)
  })

  it('throws when UnauthorizeCredentials has duplicates', function () {
    const invalidCredentials = [validCredential, validCredential]
    const errorMessage =
      'DepositPreauth: Credentials cannot contain duplicate elements'

    depositPreauth.UnauthorizeCredentials = invalidCredentials
    assertInvalid(depositPreauth, errorMessage)
  })
})
