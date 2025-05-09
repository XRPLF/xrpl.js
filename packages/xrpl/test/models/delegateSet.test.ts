import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateDelegateSet } from '../../src/models/transactions/delegateSet'

/**
 * DelegateSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DelegateSet', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'DelegateSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Authorize: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      Permissions: [65537, 0], // TrustlineAuthorize, Payment
    } as any
  })

  it('verifies valid DelegateSet', function () {
    assert.doesNotThrow(() => validateDelegateSet(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing field Authorize`, function () {
    delete tx.Authorize
    const errorMessage = 'DelegateSet: missing field Authorize'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Authorize and Account must be different`, function () {
    tx.Authorize = tx.Account
    const errorMessage = 'DelegateSet: Authorize and Account must be different.'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing field Permissions`, function () {
    delete tx.Permissions
    const errorMessage = 'DelegateSet: missing field Permissions'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions must be an array`, function () {
    tx.Permissions = 65537
    const errorMessage = 'DelegateSet: Permissions must be an array'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array cannot be empty`, function () {
    tx.Permissions = []
    const errorMessage = 'DelegateSet: Permissions array cannot be empty'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array length cannot be greater than max`, function () {
    tx.Permissions = [
      65537, 65538, 65539, 65540, 65541, 65542, 65543, 65544, 65545, 65546, 0,
    ]
    const errorMessage =
      'DelegateSet: Permissions array length cannot be greater than 10.'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array must only contain integer values`, function () {
    tx.Permissions = ['65537', 0]
    const errorMessage =
      'DelegateSet: Permissions array must only contain integer values'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array cannot contain duplicate values`, function () {
    tx.Permissions = [65537, 0, 65537]
    const errorMessage =
      'DelegateSet: Permissions array cannot contain duplicate values'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
