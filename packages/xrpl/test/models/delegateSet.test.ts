import { validateDelegateSet } from '../../src/models/transactions/delegateSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateDelegateSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateDelegateSet, message)

/**
 * DelegateSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DelegateSet', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'DelegateSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Authorize: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      Permissions: [
        { Permission: { PermissionValue: 'TrustlineAuthorize' } },
        { Permission: { PermissionValue: 'Payment' } },
      ],
    }
  })

  it('verifies valid DelegateSet', function () {
    assertValid(tx)
  })

  it(`throws w/ missing field Authorize`, function () {
    delete tx.Authorize
    const errorMessage = 'DelegateSet: missing field Authorize'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ Authorize and Account must be different`, function () {
    tx.Authorize = tx.Account
    const errorMessage = 'DelegateSet: Authorize and Account must be different.'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ missing field Permissions`, function () {
    delete tx.Permissions
    const errorMessage = 'DelegateSet: missing field Permissions'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ invalid field Permissions`, function () {
    tx.Permissions = 'TrustlineAuthorize'
    const errorMessage = 'DelegateSet: invalid field Permissions'
    assertInvalid(tx, errorMessage)
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
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ Permissions array element is malformed`, function () {
    tx.Permissions = ['Payment']
    const errorMessage = 'DelegateSet: Permissions array element is malformed'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ PermissionValue must be defined`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: null } }]
    const errorMessage = 'DelegateSet: PermissionValue must be defined'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ PermissionValue must be a string`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: 123 } }]
    const errorMessage = 'DelegateSet: PermissionValue must be a string'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ PermissionValue contains a non-delegatable transaction`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: 'AccountSet' } }]
    const errorMessage =
      'DelegateSet: PermissionValue contains a non-delegatable transaction AccountSet'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ PermissionValue contains a non-delegatable pseudo transaction`, function () {
    tx.Permissions = [{ Permission: { PermissionValue: 'EnableAmendment' } }]
    const errorMessage =
      'DelegateSet: PermissionValue contains a non-delegatable transaction EnableAmendment'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ Permissions array cannot contain duplicate values`, function () {
    tx.Permissions = [
      { Permission: { PermissionValue: 'Payment' } },
      { Permission: { PermissionValue: 'TrustSet' } },
      { Permission: { PermissionValue: 'Payment' } },
    ]
    const errorMessage =
      'DelegateSet: Permissions array cannot contain duplicate values'
    assertInvalid(tx, errorMessage)
  })
})
