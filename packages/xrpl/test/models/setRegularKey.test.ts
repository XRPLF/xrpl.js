import { validateSetRegularKey } from '../../src/models/transactions/setRegularKey'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSetRegularKey)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSetRegularKey, message)

/**
 * SetRegularKey Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SetRegularKey', function () {
  let account: any

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
    assertValid(account)
  })

  it(`verifies w/o SetRegularKey`, function () {
    account.RegularKey = undefined
    assertValid(account)
  })

  it(`throws w/ invalid RegularKey`, function () {
    account.RegularKey = 12369846963

    assertInvalid(account, 'SetRegularKey: invalid field RegularKey')
  })
})
