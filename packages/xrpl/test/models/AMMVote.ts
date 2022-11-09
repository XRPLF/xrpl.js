import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

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
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      TradingFee: 25,
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMVote`, function () {
    assert.doesNotThrow(() => validate(vote))
  })

  it(`throws w/ missing field AMMID`, function () {
    delete vote.AMMID
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    vote.AMMID = 1234
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: AMMID must be a string',
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
