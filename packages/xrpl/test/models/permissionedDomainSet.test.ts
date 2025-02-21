import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { AuthorizeCredential, validate, ValidationError } from '../../src'

/**
 * PermissionedDomainSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PermissionedDomainSet', function () {
  let tx
  const sampleCredential: AuthorizeCredential = {
    Credential: {
      CredentialType: stringToHex('Passport'),
      Issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
    },
  }

  beforeEach(function () {
    tx = {
      TransactionType: 'PermissionedDomainSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      DomainID:
        'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A215103737',
      AcceptedCredentials: [sampleCredential],
    } as any
  })

  it('verifies valid PermissionedDomainSet', function () {
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws with invalid field DomainID`, function () {
    // DomainID is expected to be a string
    tx.DomainID = 1234
    const errorMessage = 'PermissionedDomainSet: invalid field DomainID'
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing field AcceptedCredentials`, function () {
    delete tx.AcceptedCredentials
    const errorMessage =
      'PermissionedDomainSet: missing field AcceptedCredentials'
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws when AcceptedCredentials exceeds maximum length', function () {
    tx.AcceptedCredentials = Array(11).fill(sampleCredential)
    assert.throws(
      () => validate(tx),
      ValidationError,
      'PermissionedDomainSet: Credentials length cannot exceed 10 elements',
    )
  })

  it('throws when AcceptedCredentials is empty', function () {
    tx.AcceptedCredentials = []
    assert.throws(
      () => validate(tx),
      ValidationError,
      'PermissionedDomainSet: Credentials cannot be an empty array',
    )
  })

  it('throws when AcceptedCredentials is not an array type', function () {
    tx.AcceptedCredentials = 'AcceptedCredentials is not an array'
    assert.throws(
      () => validate(tx),
      ValidationError,
      'PermissionedDomainSet: invalid field AcceptedCredentials',
    )
  })

  it('throws when AcceptedCredentials contains duplicates', function () {
    tx.AcceptedCredentials = [sampleCredential, sampleCredential]
    assert.throws(
      () => validate(tx),
      ValidationError,
      'PermissionedDomainSet: Credentials cannot contain duplicate elements',
    )
  })

  it('throws when AcceptedCredentials contains invalid format', function () {
    tx.AcceptedCredentials = [{ Field1: 'Value1', Field2: 'Value2' }]
    assert.throws(
      () => validate(tx),
      ValidationError,
      'PermissionedDomainSet: Invalid Credentials format',
    )
  })
})
