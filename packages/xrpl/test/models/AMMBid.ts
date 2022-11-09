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
      MinBidPrice: '5',
      MaxBidPrice: '10',
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

  it(`throws w/ MinBidPrice must be an Amount`, function () {
    bid.MinBidPrice = 5
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: MinBidPrice must be an Amount',
    )
  })

  it(`throws w/ MaxBidPrice must be an Amount`, function () {
    bid.MaxBidPrice = 10
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: MaxBidPrice must be an Amount',
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
