import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMBid Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMBid', function () {
  let bid

  beforeEach(function () {
    bid = {
      TransactionType: 'AMMBid',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      BidMin: '5',
      BidMax: '10',
      AuthAccounts: [
        {
          AuthAccount: {
            Account: 'rNZdsTBP5tH1M6GHC6bTreHAp6ouP8iZSh',
          },
        },
        {
          AuthAccount: {
            Account: 'rfpFv97Dwu89FTyUwPjtpZBbuZxTqqgTmH',
          },
        },
        {
          AuthAccount: {
            Account: 'rzzYHPGb8Pa64oqxCzmuffm122bitq3Vb',
          },
        },
        {
          AuthAccount: {
            Account: 'rhwxHxaHok86fe4LykBom1jSJ3RYQJs1h4',
          },
        },
      ],
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMBid`, function () {
    assert.doesNotThrow(() => validate(bid))
  })

  it(`throws w/ BidMin must be an Amount`, function () {
    bid.BidMin = 5
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: BidMin must be an Amount',
    )
  })

  it(`throws w/ BidMax must be an Amount`, function () {
    bid.BidMax = 10
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: BidMax must be an Amount',
    )
  })

  it(`throws w/ AuthAccounts length must not be greater than 4`, function () {
    bid.AuthAccounts.push({
      AuthAccount: {
        Account: 'r3X6noRsvaLapAKCG78zAtWcbhB3sggS1s',
      },
    })

    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: AuthAccounts length must not be greater than 4',
    )
  })
})
