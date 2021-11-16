import { assert } from 'chai'

import { validate, ValidationError } from 'xrpl-local'
import { validateCheckCancel } from 'xrpl-local/models/transactions/checkCancel'

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

    assert.doesNotThrow(() => validateCheckCancel(validCheckCancel))
    assert.doesNotThrow(() => validate(validCheckCancel))
  })

  it(`throws w/ invalid CheckCancel`, function () {
    const invalidCheckID = {
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      TransactionType: 'CheckCancel',
      CheckID: 4964734566545678,
    } as any

    assert.throws(
      () => validateCheckCancel(invalidCheckID),
      ValidationError,
      'CheckCancel: invalid CheckID',
    )
    assert.throws(
      () => validate(invalidCheckID),
      ValidationError,
      'CheckCancel: invalid CheckID',
    )
  })
})
