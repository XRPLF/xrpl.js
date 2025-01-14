import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validatePermissionedDomainDelete } from '../../src/models/transactions/permissionedDomainDelete'

/**
 * PermissionedDomainDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PermissionedDomainDelete', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'PermissionedDomainDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      DomainID:
        'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A215103737',
    } as any
  })

  it('verifies valid PermissionedDomainDelete', function () {
    assert.doesNotThrow(() => validatePermissionedDomainDelete(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing field DomainID`, function () {
    delete tx.DomainID
    const errorMessage = 'PermissionedDomainDelete: missing field DomainID'
    assert.throws(
      () => validatePermissionedDomainDelete(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid DomainID`, function () {
    tx.DomainID = 1234
    const errorMessage = 'PermissionedDomainDelete: invalid field DomainID'
    assert.throws(
      () => validatePermissionedDomainDelete(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
