import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCredentialAccept } from '../../src/models/transactions/CredentialAccept'

/**
 * AMMDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CredentialAccept', function () {
  let credentialAccept

  beforeEach(function () {
    credentialAccept = {
      TransactionType: 'CredentialAccept',
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Account: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid CredentialAccept`, function () {
    assert.doesNotThrow(() => validateCredentialAccept(credentialAccept))
    assert.doesNotThrow(() => validate(credentialAccept))
  })

  it(`throws w/ missing field Account`, function () {
    delete credentialAccept.issuer
    const errorMessage = 'CredentialAccept: missing field Issuer'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Account not a string`, function () {
    credentialAccept.account = 123
    const errorMessage = 'CredentialAccept: Account must be a string'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field Issuer`, function () {
    delete credentialAccept.Issuer
    const errorMessage = 'CredentialAccept: missing field Issuer'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Issuer not a string`, function () {
    credentialAccept.Issuer = 123
    const errorMessage = 'CredentialAccept: Issuer must be a string'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field CredentialType`, function () {
    delete credentialAccept.CredentialType
    const errorMessage = 'CredentialAccept: missing field CredentialType'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field too long`, function () {
    credentialAccept.CredentialType = stringToHex(
      'PassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassport',
    )
    const errorMessage = 'CredentialAccept: CredentialType length must be < 128'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field empty`, function () {
    credentialAccept.CredentialType = ''
    const errorMessage = 'CredentialAccept: CredentialType length must be > 0'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field not hex`, function () {
    credentialAccept.CredentialType = 'this is not hex'
    const errorMessage =
      'CredentialAccept: CredentialType myust be encoded in hex'
    assert.throws(
      () => validateCredentialAccept(credentialAccept),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialAccept),
      ValidationError,
      errorMessage,
    )
  })
})
