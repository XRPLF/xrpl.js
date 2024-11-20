import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateAMMDelete } from '../../src/models/transactions/AMMDelete'
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
      issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      credential_type: stringToHex('Passport'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid CredentialAccept`, function () {
    assert.doesNotThrow(() => validateCredentialAccept(credentialAccept))
    assert.doesNotThrow(() => validate(credentialAccept))
  })

  it(`throws w/ missing field issuer`, function () {
    delete credentialAccept.issuer
    const errorMessage = 'CredentialAccept: CredentialType must be a string'
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

  it(`throws w/ missing field subject`, function () {
    delete credentialAccept.subject
    const errorMessage = 'CredentialAccept: CredentialType must be a string'
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

  it(`throws w/ missing field credential_type`, function () {
    delete ammDelete.Asset
    const errorMessage = 'AMMDelete: missing field Asset'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })

  it(`throws w/ credential type field too long`, function () {
    delete ammDelete.Asset
    const errorMessage = 'AMMDelete: missing field Asset'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })

  it(`throws w/ credential type field empty`, function () {
    delete ammDelete.Asset
    const errorMessage = 'AMMDelete: missing field Asset'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })

  it(`throws w/ credential type field not hex`, function () {
    delete ammDelete.Asset
    const errorMessage = 'AMMDelete: missing field Asset'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })
})
