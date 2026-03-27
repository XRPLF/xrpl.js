import { validateCheckCash } from '../../src/models/transactions/checkCash'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateCheckCash)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCheckCash, message)

/**
 * CheckCash Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CheckCash', function () {
  it(`verifies valid CheckCash`, function () {
    const validCheckCash = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: '100000000',
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
      Fee: '12',
    } as any

    assertValid(validCheckCash)
  })

  it(`throws w/ invalid CheckID`, function () {
    const invalidCheckID = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: '100000000',
      CheckID: 83876645678567890,
    } as any

    assertInvalid(invalidCheckID, 'CheckCash: invalid CheckID')
  })

  it(`throws w/ invalid Amount`, function () {
    const invalidAmount = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: 100000000,
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
    } as any

    assertInvalid(invalidAmount, 'CheckCash: invalid Amount')
  })

  it(`throws w/ having both Amount and DeliverMin`, function () {
    const invalidDeliverMin = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: '100000000',
      DeliverMin: 852156963,
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
    } as any

    assertInvalid(
      invalidDeliverMin,
      'CheckCash: cannot have both Amount and DeliverMin',
    )
  })

  it(`throws w/ invalid DeliverMin`, function () {
    const invalidDeliverMin = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      DeliverMin: 852156963,
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
    } as any

    assertInvalid(invalidDeliverMin, 'CheckCash: invalid DeliverMin')
  })
})
