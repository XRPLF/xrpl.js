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
  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'SetRegularKey',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      Flags: 0,
      RegularKey: 'rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD',
    } as any
  })

  it(`verifies valid SetRegularKey`, function () {
    assertValid(tx)
  })

  it(`verifies w/o SetRegularKey`, function () {
    tx.RegularKey = undefined
    assertValid(tx)
  })

  it(`throws w/ invalid RegularKey`, function () {
    tx.RegularKey = 12369846963

    assertInvalid(tx, 'SetRegularKey: RegularKey must be a string')
  })
})
