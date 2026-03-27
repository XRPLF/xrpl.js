import { validateCheckCancel } from '../../src/models/transactions/checkCancel'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateCheckCancel)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCheckCancel, message)

/**
 * CheckCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CheckCancel', function () {
  it(`verifies valid CheckCancel`, function () {
    const validCheckCancel = {
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      TransactionType: 'CheckCancel',
      CheckID:
        '49647F0D748DC3FE26BDACBC57F251AADEFFF391403EC9BF87C97F67E9977FB0',
    } as any

    assertValid(validCheckCancel)
  })

  it(`throws w/ invalid CheckCancel`, function () {
    const invalidCheckID = {
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      TransactionType: 'CheckCancel',
      CheckID: 4964734566545678,
    } as any

    assertInvalid(invalidCheckID, 'CheckCancel: invalid CheckID')
  })
})
