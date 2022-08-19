import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMInstanceCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMInstanceCreate', function () {
  it(`verifies valid AMMInstanceCreate`, function () {
    const validTx = {
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

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`throws w/ missing Asset1`, function () {
    const invalid = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: 12,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMInstanceCreate: missing field Asset1',
    )
  })

  it(`throws w/ Asset1 must be an Amount`, function () {
    const invalidAsset1 = 1000
    const invalidTx = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: invalidAsset1,
      Asset2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: 12,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalidTx),
      ValidationError,
      'AMMInstanceCreate: Asset1 must be an Amount',
    )
  })

  it(`throws w/ missing Asset2`, function () {
    const invalid = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: '1000',
      TradingFee: 12,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMInstanceCreate: missing field Asset2',
    )
  })

  it(`throws w/ Asset2 must be an Amount`, function () {
    const invalidAsset2 = 1000
    const invalidTx = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: '1000',
      Asset2: invalidAsset2,
      TradingFee: 12,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalidTx),
      ValidationError,
      'AMMInstanceCreate: Asset2 must be an Amount',
    )
  })

  it(`throws w/ missing TradingFee`, function () {
    const invalid = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: '1000',
      Asset2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMInstanceCreate: missing field TradingFee',
    )
  })

  it(`throws w/ TradingFee must be a number`, function () {
    const invalidTradingFee = '12'
    const invalidTx = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: '1000',
      Asset2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: invalidTradingFee,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalidTx),
      ValidationError,
      'AMMInstanceCreate: TradingFee must be a number',
    )
  })

  it(`throws w/ TradingFee must not be greater than 65000`, function () {
    const invalidTradingFee = 65001
    const invalidTx = {
      TransactionType: 'AMMInstanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1: '1000',
      Asset2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: invalidTradingFee,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalidTx),
      ValidationError,
      `AMMInstanceCreate: TradingFee must not be greater than 65000`,
    )
  })
})
