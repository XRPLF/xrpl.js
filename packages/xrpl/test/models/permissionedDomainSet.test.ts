import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { Credential } from '../../src/models/ledger/PermissionedDomain'
import { validatePermissionedDomainSet } from '../../src/models/transactions/permissionedDomainSet'
import { validate, ValidationError } from '../../src'

/**
 * PermissionedDomainSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PermissionedDomainSet', function () {
  let tx

  beforeEach(function () {

    const sampleCredential: Credential = {
      Credential: {
        CredentialType: stringToHex('Passport'),
        Issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8'
      }
    }

    tx = {
      TransactionType: 'PermissionedDomainSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      DomainID: 'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A215103737',
      AcceptedCredentials: [sampleCredential]
    } as any
  })

  it('verifies valid PermissionedDomainSet', function () {
    assert.doesNotThrow(() => validatePermissionedDomainSet(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws with invalid field DomainID`, function () {
    tx.DomainID = 1234 // DomainID is expected to be a string
    const errorMessage = 'PermissionedDomainSet: invalid field DomainID'
    assert.throws(() => validatePermissionedDomainSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing field AcceptedCredentials`, function () {
    delete tx.AcceptedCredentials
    const errorMessage = 'PermissionedDomainSet: missing field AcceptedCredentials'
    assert.throws(() => validatePermissionedDomainSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
