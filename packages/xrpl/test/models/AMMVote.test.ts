import { validateAMMVote } from '../../src/models/transactions/AMMVote'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMVote)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMVote, message)

/**
 * AMMVote Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMVote', function () {
  let vote: any

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
    assertValid(vote)
  })

  it(`throws w/ missing field Asset`, function () {
    delete vote.Asset
    const errorMessage = 'AMMVote: missing field Asset'
    assertInvalid(vote, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    vote.Asset = 1234
    const errorMessage = 'AMMVote: Asset must be a Currency'
    assertInvalid(vote, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete vote.Asset2
    const errorMessage = 'AMMVote: missing field Asset2'
    assertInvalid(vote, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    vote.Asset2 = 1234
    const errorMessage = 'AMMVote: Asset2 must be a Currency'
    assertInvalid(vote, errorMessage)
  })

  it(`throws w/ missing field TradingFee`, function () {
    delete vote.TradingFee
    const errorMessage = 'AMMVote: missing field TradingFee'
    assertInvalid(vote, errorMessage)
  })

  it(`throws w/ TradingFee must be a number`, function () {
    vote.TradingFee = '25'
    const errorMessage = 'AMMVote: TradingFee must be a number'
    assertInvalid(vote, errorMessage)
  })

  it(`throws when TradingFee is greater than AMM_MAX_TRADING_FEE`, function () {
    vote.TradingFee = 1001
    const errorMessage = 'AMMVote: TradingFee must be between 0 and 1000'
    assertInvalid(vote, errorMessage)
  })

  it(`throws when TradingFee is a negative number`, function () {
    vote.TradingFee = -1
    const errorMessage = 'AMMVote: TradingFee must be between 0 and 1000'
    assertInvalid(vote, errorMessage)
  })
})
