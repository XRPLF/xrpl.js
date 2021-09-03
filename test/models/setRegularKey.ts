import { assert } from 'chai'

import { ValidationError } from 'xrpl-local/common/errors'

import { verifySetRegularKey } from '../../src/models/transactions/setRegularKey'

/**
 * SetRegularKey Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SetRegularKey', function () {
  let account

  beforeEach(function () {
    account = {
      TransactionType: 'SetRegularKey',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      Flags: 0,
      RegularKey: 'rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD',
    } as any
  })

  it(`verifies valid SetRegularKey`, function () {
    assert.doesNotThrow(() => verifySetRegularKey(account))
  })

  it(`verifies w/o SetRegularKey`, function () {
    account.RegularKey = undefined
    assert.doesNotThrow(() => verifySetRegularKey(account))
  })

  it(`throws w/ invalid RegularKey`, function () {
    account.RegularKey = 12369846963

    assert.throws(
      () => verifySetRegularKey(account),
      ValidationError,
      'SetRegularKey: RegularKey must be a string',
    )
  })
})
