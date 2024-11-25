import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCredentialCreate } from '../../src/models/transactions/CredentialCreate'

/**
 * AMMDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('credentialCreate', function () {
  let credentialCreate

  beforeEach(function () {
    credentialCreate = {
      TransactionType: 'CredentialCreate',
      account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid credentialCreate`, function () {
    assert.doesNotThrow(() => validateCredentialCreate(credentialCreate))
    assert.doesNotThrow(() => validate(credentialCreate))
  })

  it(`throws w/ missing field issuer`, function () {
    delete credentialCreate.account
    const errorMessage = 'CredentialCreate: missing field Issuer'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field subject`, function () {
    delete credentialCreate.subject
    const errorMessage = 'CredentialCreate: missing field Subject'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field credentialType`, function () {
    delete credentialCreate.CredentialType
    const errorMessage = 'CredentialCreate: missing field CredentialType'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credential type field too long`, function () {
    credentialCreate.CredentialType = stringToHex(
      'PassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassport',
    )
    const errorMessage =
      'CredentialCreate: CredentialType length must be < 128.'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credential type field empty`, function () {
    credentialCreate.CredentialType = ''
    const errorMessage = 'CredentialCreate: CredentialType length must be > 0.'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credential type field not hex`, function () {
    credentialCreate.CredentialType = 'this is not hex'
    const errorMessage =
      'CredentialCreate: CredentialType myust be encoded in hex.'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })
})
