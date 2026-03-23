import { validatePermissionedDomainDelete } from '../../src/models/transactions/permissionedDomainDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePermissionedDomainDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePermissionedDomainDelete, message)

/**
 * PermissionedDomainDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PermissionedDomainDelete', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'PermissionedDomainDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      DomainID:
        'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A215103737',
    } as any
  })

  it('verifies valid PermissionedDomainDelete', function () {
    assertValid(tx)
  })

  it(`throws w/ missing field DomainID`, function () {
    delete tx.DomainID
    const errorMessage = 'PermissionedDomainDelete: missing field DomainID'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ invalid DomainID`, function () {
    tx.DomainID = 1234
    const errorMessage = 'PermissionedDomainDelete: invalid field DomainID'
    assertInvalid(tx, errorMessage)
  })
})
