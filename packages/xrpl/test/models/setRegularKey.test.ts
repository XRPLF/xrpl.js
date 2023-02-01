import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateSetRegularKey } from '../../src/models/transactions/setRegularKey'

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
    assert.doesNotThrow(() => validateSetRegularKey(account))
    assert.doesNotThrow(() => validate(account))
  })

  it(`verifies w/o SetRegularKey`, function () {
    account.RegularKey = undefined
    assert.doesNotThrow(() => validateSetRegularKey(account))
    assert.doesNotThrow(() => validate(account))
  })

  it(`throws w/ invalid RegularKey`, function () {
    account.RegularKey = 12369846963

    assert.throws(
      () => validateSetRegularKey(account),
      ValidationError,
      'SetRegularKey: RegularKey must be a string',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'SetRegularKey: RegularKey must be a string',
    )
  })
})
