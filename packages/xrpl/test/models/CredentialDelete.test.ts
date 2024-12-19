import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCredentialDelete } from '../../src/models/transactions/CredentialDelete'

/**
 * CredentialDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CredentialDelete', function () {
  let credentialDelete

  beforeEach(function () {
    credentialDelete = {
      TransactionType: 'CredentialDelete',
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      Account: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid credentialDelete`, function () {
    assert.doesNotThrow(() => validateCredentialDelete(credentialDelete))
    assert.doesNotThrow(() => validate(credentialDelete))
  })

  it(`throws w/ missing field Account`, function () {
    credentialDelete.Account = undefined
    const errorMessage = 'CredentialDelete: missing field Account'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Account not string`, function () {
    credentialDelete.Account = 123
    const errorMessage = 'CredentialDelete: invalid field Account'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Subject not string`, function () {
    credentialDelete.Subject = 123
    const errorMessage = 'CredentialDelete: invalid field Subject'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Issuer not string`, function () {
    credentialDelete.Issuer = 123
    const errorMessage = 'CredentialDelete: invalid field Issuer'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field Subject and Issuer`, function () {
    credentialDelete.Subject = undefined
    credentialDelete.Issuer = undefined
    const errorMessage =
      'CredentialDelete: either `Issuer` or `Subject` must be provided'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field credentialType`, function () {
    credentialDelete.CredentialType = undefined
    const errorMessage = 'CredentialDelete: missing field CredentialType'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field too long`, function () {
    credentialDelete.CredentialType = stringToHex('A'.repeat(129))
    const errorMessage =
      'CredentialDelete: CredentialType length cannot be > 128'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field empty`, function () {
    credentialDelete.CredentialType = ''
    const errorMessage =
      'CredentialDelete: CredentialType cannot be an empty string'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field not hex`, function () {
    credentialDelete.CredentialType = 'this is not hex'
    const errorMessage =
      'CredentialDelete: CredentialType must be encoded in hex'
    assert.throws(
      () => validateCredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })
})
