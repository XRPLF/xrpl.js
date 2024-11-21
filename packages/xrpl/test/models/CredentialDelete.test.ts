import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCredentialDelete } from '../../src/models/transactions/CredentialDelete'

/**
 * AMMDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('credentialDelete', function () {
  let credentialDelete

  beforeEach(function () {
    credentialDelete = {
      TransactionType: 'credentialDelete',
      issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid credentialDelete`, function () {
    assert.doesNotThrow(() => validatecredentialDelete(credentialDelete))
    assert.doesNotThrow(() => validate(credentialDelete))
  })

  it(`throws w/ missing field issuer`, function () {
    delete credentialDelete.issuer
    const errorMessage = 'credentialDelete: missing field Issuer'
    assert.throws(
      () => validatecredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field subject`, function () {
    delete credentialDelete.subject
    const errorMessage = 'credentialDelete: missing field Subject'
    assert.throws(
      () => validatecredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field credential_type`, function () {
    delete credentialDelete.CredentialType
    const errorMessage = 'credentialDelete: missing field CredentialType'
    assert.throws(
      () => validatecredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credential type field too long`, function () {
    credentialDelete.CredentialType = stringToHex(
      'PassportPassportPassportPassportPassportPassportPassportPassportPassport',
    )
    const errorMessage =
      'credentialDelete: CredentialType length must be < 128.'
    assert.throws(
      () => validatecredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credential type field empty`, function () {
    credentialDelete.CredentialType = ''
    const errorMessage = 'credentialDelete: CredentialType length must be > 0.'
    assert.throws(
      () => validatecredentialDelete(credentialDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credential type field not hex`, function () {
    credentialDelete.CredentialType = 'this is not hex'
    const errorMessage =
      'credentialDelete: CredentialType myust be encoded in hex.'
    assert.throws(
      () => validatecredentialDelete(credentialDelete),
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
