import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCredentialAccept } from '../../src/models/transactions/CredentialAccept'

/**
 * CredentialAccept Transaction Verification Testing.
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
    credentialAccept.Account = undefined
    const errorMessage = 'CredentialAccept: missing field Account'
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
    credentialAccept.Account = 123
    const errorMessage = 'CredentialAccept: invalid field Account'
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
    credentialAccept.Issuer = undefined
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
    const errorMessage = 'CredentialAccept: invalid field Issuer'
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
    credentialAccept.CredentialType = undefined
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
    credentialAccept.CredentialType = stringToHex('A'.repeat(129))
    const errorMessage =
      'CredentialAccept: CredentialType length cannot be > 128'
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
    const errorMessage =
      'CredentialAccept: CredentialType cannot be an empty string'
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
      'CredentialAccept: CredentialType must be encoded in hex'
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
