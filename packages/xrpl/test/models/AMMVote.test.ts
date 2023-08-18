import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateAMMVote } from '../../src/models/transactions/AMMVote'

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
    assert.doesNotThrow(() => validateAMMVote(vote))
    assert.doesNotThrow(() => validate(vote))
  })

  it(`throws w/ missing field Asset`, function () {
    delete vote.Asset
    const errorMessage = 'AMMVote: missing field Asset'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    vote.Asset = 1234
    const errorMessage = 'AMMVote: Asset must be a Currency'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete vote.Asset2
    const errorMessage = 'AMMVote: missing field Asset2'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    vote.Asset2 = 1234
    const errorMessage = 'AMMVote: Asset2 must be a Currency'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws w/ missing field TradingFee`, function () {
    delete vote.TradingFee
    const errorMessage = 'AMMVote: missing field TradingFee'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws w/ TradingFee must be a number`, function () {
    vote.TradingFee = '25'
    const errorMessage = 'AMMVote: TradingFee must be a number'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws when TradingFee is greater than AMM_MAX_TRADING_FEE`, function () {
    vote.TradingFee = 1001
    const errorMessage = 'AMMVote: TradingFee must be between 0 and 1000'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })

  it(`throws when TradingFee is a negative number`, function () {
    vote.TradingFee = -1
    const errorMessage = 'AMMVote: TradingFee must be between 0 and 1000'
    assert.throws(() => validateAMMVote(vote), ValidationError, errorMessage)
    assert.throws(() => validate(vote), ValidationError, errorMessage)
  })
})
