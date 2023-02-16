import { assert } from 'chai'

import { validate, ValidationError } from '../../src'

/**
 * AMMCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMCreate', function () {
  let ammCreate

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
    } as any
  })

  it(`verifies valid AMMCreate`, function () {
    assert.doesNotThrow(() => validate(ammCreate))
  })

  it(`throws w/ missing Amount`, function () {
    delete ammCreate.Amount
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      'AMMCreate: missing field Amount',
    )
  })

  it(`throws w/ Amount must be an Amount`, function () {
    ammCreate.Amount = 1000
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      'AMMCreate: Amount must be an Amount',
    )
  })

  it(`throws w/ missing Amount2`, function () {
    delete ammCreate.Amount2
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      'AMMCreate: missing field Amount2',
    )
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    ammCreate.Amount2 = 1000
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      'AMMCreate: Amount2 must be an Amount',
    )
  })

  it(`throws w/ missing TradingFee`, function () {
    delete ammCreate.TradingFee
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      'AMMCreate: missing field TradingFee',
    )
  })

  it(`throws w/ TradingFee must be a number`, function () {
    ammCreate.TradingFee = '12'
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      'AMMCreate: TradingFee must be a number',
    )
  })

  it(`throws when TradingFee is greater than 1000`, function () {
    ammCreate.TradingFee = 1001
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      `AMMCreate: TradingFee must be between 0 and 1000`,
    )
  })

  it(`throws when TradingFee is a negative number`, function () {
    ammCreate.TradingFee = -1
    assert.throws(
      () => validate(ammCreate),
      ValidationError,
      `AMMCreate: TradingFee must be between 0 and 1000`,
    )
  })
})
