import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'
import { validateSetRegularKey } from 'xrpl-local/models/transactions/setRegularKey'

/**
 * SetRegularKey Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SetRegularKey', () => {
  let account

  beforeEach(() => {
    account = {
      TransactionType: 'SetRegularKey',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      Flags: 0,
      RegularKey: 'rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD',
    } as any
  })

  it(`verifies valid SetRegularKey`, () => {
    assert.doesNotThrow(() => validateSetRegularKey(account))
    assert.doesNotThrow(() => validate(account))
  })

  it(`verifies w/o SetRegularKey`, () => {
    account.RegularKey = undefined
    assert.doesNotThrow(() => validateSetRegularKey(account))
    assert.doesNotThrow(() => validate(account))
  })

  it(`throws w/ invalid RegularKey`, () => {
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
