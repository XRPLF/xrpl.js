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
      Permissions: [
        { Permission: { PermissionValue: 'TrustlineAuthorize' } },
        { Permission: { PermissionValue: 'Payment' } },
      ],
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

  it(`throws w/ invalid field Permissions`, function () {
    tx.Permissions = 'TrustlineAuthorize'
    const errorMessage = 'DelegateSet: invalid field Permissions'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array length cannot be greater than max`, function () {
    tx.Permissions = [
      { Permission: { PermissionValue: 'Payment' } },
      { Permission: { PermissionValue: 'TrustSet' } },
      { Permission: { PermissionValue: 'TrustlineFreeze' } },
      { Permission: { PermissionValue: 'TrustlineUnfreeze' } },
      { Permission: { PermissionValue: 'TrustlineAuthorize' } },
      { Permission: { PermissionValue: 'AccountDomainSet' } },
      { Permission: { PermissionValue: 'AccountEmailHashSet' } },
      { Permission: { PermissionValue: 'AccountMessageKeySet' } },
      { Permission: { PermissionValue: 'AccountTransferRateSet' } },
      { Permission: { PermissionValue: 'AccountTickSizeSet' } },
      { Permission: { PermissionValue: 'PaymentMint' } },
    ]
    const errorMessage =
      'DelegateSet: Permissions array length cannot be greater than 10.'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array element is malformed`, function () {
    tx.Permissions = ['Payment']
    const errorMessage = 'DelegateSet: Permissions array element is malformed'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ PermissionValue must be defined`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: null } }]
    const errorMessage = 'DelegateSet: PermissionValue must be defined'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ PermissionValue must be a string`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: 123 } }]
    const errorMessage = 'DelegateSet: PermissionValue must be a string'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ PermissionValue contains a non-delegatable transaction`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: 'AccountSet' } }]
    const errorMessage =
      'DelegateSet: PermissionValue contains a non-delegatable transaction AccountSet'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ PermissionValue contains a non-delegatable pseudo transaction`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: 'EnableAmendment' } }]
    const errorMessage =
      'DelegateSet: PermissionValue contains a non-delegatable transaction EnableAmendment'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Permissions array cannot contain duplicate values`, function () {
    tx.Permissions = [
      { Permission: { PermissionValue: 'Payment' } },
      { Permission: { PermissionValue: 'TrustSet' } },
      { Permission: { PermissionValue: 'Payment' } },
    ]
    const errorMessage =
      'DelegateSet: Permissions array cannot contain duplicate values'
    assert.throws(() => validateDelegateSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
