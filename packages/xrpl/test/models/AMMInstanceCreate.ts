import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMInstanceCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMInstanceCreate', function () {
  let instanceCreate

  beforeEach(function () {
    instanceCreate = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: '1000',
      Asset2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: 12,
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMInstanceCreate`, function () {
    assert.doesNotThrow(() => validate(instanceCreate))
  })

  it(`throws w/ missing Asset1`, function () {
    delete instanceCreate.Asset1
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      'AMMInstanceCreate: missing field Asset1',
    )
  })

  it(`throws w/ Asset1 must be an Amount`, function () {
    instanceCreate.Asset1 = 1000
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      'AMMInstanceCreate: Asset1 must be an Amount',
    )
  })

  it(`throws w/ missing Asset2`, function () {
    delete instanceCreate.Asset2
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      'AMMInstanceCreate: missing field Asset2',
    )
  })

  it(`throws w/ Asset2 must be an Amount`, function () {
    instanceCreate.Asset2 = 1000
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      'AMMInstanceCreate: Asset2 must be an Amount',
    )
  })

  it(`throws w/ missing TradingFee`, function () {
    delete instanceCreate.TradingFee
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      'AMMInstanceCreate: missing field TradingFee',
    )
  })

  it(`throws w/ TradingFee must be a number`, function () {
    instanceCreate.TradingFee = '12'
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      'AMMInstanceCreate: TradingFee must be a number',
    )
  })

  it(`throws w/ TradingFee must not be greater than 65000`, function () {
    instanceCreate.TradingFee = 65001
    assert.throws(
      () => validate(instanceCreate),
      ValidationError,
      `AMMInstanceCreate: TradingFee must not be greater than 65000`,
    )
  })
})
