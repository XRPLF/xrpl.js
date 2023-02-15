import { assert } from 'chai'

import { validate, ValidationError } from '../../src'

/**
 * AMMVote Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMVote', function () {
  let vote

  beforeEach(function () {
    vote = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      },
      TradingFee: 25,
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMVote`, function () {
    assert.doesNotThrow(() => validate(vote))
  })

  it(`throws w/ missing field Asset`, function () {
    delete vote.Asset
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: missing field Asset',
    )
  })

  it(`throws w/ Asset must be an Issue`, function () {
    vote.Asset = 1234
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: Asset must be an Issue',
    )
  })

  it(`throws w/ missing field Asset2`, function () {
    delete vote.Asset2
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: missing field Asset2',
    )
  })

  it(`throws w/ Asset2 must be an Issue`, function () {
    vote.Asset2 = 1234
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: Asset2 must be an Issue',
    )
  })

  it(`throws w/ missing field TradingFee`, function () {
    delete vote.TradingFee
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: missing field TradingFee',
    )
  })

  it(`throws w/ TradingFee must be a number`, function () {
    vote.TradingFee = '25'
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: TradingFee must be a number',
    )
  })

  it(`throws when TradingFee is greater than AMM_MAX_TRADING_FEE`, function () {
    vote.TradingFee = 1001
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: TradingFee must be between 0 and 1000',
    )
  })

  it(`throws when TradingFee is a negative number`, function () {
    vote.TradingFee = -1
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: TradingFee must be between 0 and 1000',
    )
  })
})
