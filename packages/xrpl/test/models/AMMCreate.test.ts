import { validateAMMCreate } from '../../src/models/transactions/AMMCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMCreate, message)

/**
 * AMMCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMCreate', function () {
  let ammCreate: any

  beforeEach(function () {
    ammCreate = {
      TransactionType: 'AMMCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Amount: '1000',
      Amount2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: 12,
      Sequence: 1337,
    }
  })

  it(`verifies valid AMMCreate`, function () {
    assertValid(ammCreate)
  })

  it(`throws w/ missing Amount`, function () {
    delete ammCreate.Amount
    const errorMessage = 'AMMCreate: missing field Amount'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ Amount must be an Amount`, function () {
    ammCreate.Amount = 1000
    const errorMessage = 'AMMCreate: Amount must be an Amount'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ missing Amount2`, function () {
    delete ammCreate.Amount2
    const errorMessage = 'AMMCreate: missing field Amount2'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    ammCreate.Amount2 = 1000
    const errorMessage = 'AMMCreate: Amount2 must be an Amount'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ missing TradingFee`, function () {
    delete ammCreate.TradingFee
    const errorMessage = 'AMMCreate: missing field TradingFee'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ TradingFee must be a number`, function () {
    ammCreate.TradingFee = '12'
    const errorMessage = 'AMMCreate: TradingFee must be a number'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws when TradingFee is greater than 1000`, function () {
    ammCreate.TradingFee = 1001
    const errorMessage = 'AMMCreate: TradingFee must be between 0 and 1000'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws when TradingFee is a negative number`, function () {
    ammCreate.TradingFee = -1
    const errorMessage = 'AMMCreate: TradingFee must be between 0 and 1000'
    assertInvalid(ammCreate, errorMessage)
  })
})
