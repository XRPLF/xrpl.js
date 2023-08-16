import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateAMMBid } from '../../src/models/transactions/AMMBid'

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
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      },
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
    assert.doesNotThrow(() => validateAMMBid(bid))
    assert.doesNotThrow(() => validate(bid))
  })

  it(`throws w/ missing field Asset`, function () {
    delete bid.Asset
    const errorMessage = 'AMMBid: missing field Asset'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    bid.Asset = 1234
    const errorMessage = 'AMMBid: Asset must be a Currency'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete bid.Asset2
    const errorMessage = 'AMMBid: missing field Asset2'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    bid.Asset2 = 1234
    const errorMessage = 'AMMBid: Asset2 must be a Currency'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ BidMin must be an Amount`, function () {
    bid.BidMin = 5
    const errorMessage = 'AMMBid: BidMin must be an Amount'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ BidMax must be an Amount`, function () {
    bid.BidMax = 10
    const errorMessage = 'AMMBid: BidMax must be an Amount'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ AuthAccounts length must not be greater than 4`, function () {
    bid.AuthAccounts.push({
      AuthAccount: {
        Account: 'r3X6noRsvaLapAKCG78zAtWcbhB3sggS1s',
      },
    })
    const errorMessage =
      'AMMBid: AuthAccounts length must not be greater than 4'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ AuthAccounts must be an AuthAccount array`, function () {
    bid.AuthAccounts = 1234
    const errorMessage = 'AMMBid: AuthAccounts must be an AuthAccount array'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ invalid AuthAccounts when AuthAccount is null`, function () {
    bid.AuthAccounts[0] = {
      AuthAccount: null,
    }
    const errorMessage = 'AMMBid: invalid AuthAccounts'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ invalid AuthAccounts when AuthAccount is undefined`, function () {
    bid.AuthAccounts[0] = {
      AuthAccount: undefined,
    }
    const errorMessage = 'AMMBid: invalid AuthAccounts'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ invalid AuthAccounts when AuthAccount is not an object`, function () {
    bid.AuthAccounts[0] = {
      AuthAccount: 1234,
    }
    const errorMessage = 'AMMBid: invalid AuthAccounts'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ invalid AuthAccounts when AuthAccount.Account is not a string`, function () {
    bid.AuthAccounts[0] = {
      AuthAccount: {
        Account: 1234,
      },
    }
    const errorMessage = 'AMMBid: invalid AuthAccounts'
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })

  it(`throws w/ AuthAccounts must not include sender's address`, function () {
    bid.AuthAccounts[0] = {
      AuthAccount: {
        Account: bid.Account,
      },
    }
    const errorMessage =
      "AMMBid: AuthAccounts must not include sender's address"
    assert.throws(() => validateAMMBid(bid), ValidationError, errorMessage)
    assert.throws(() => validate(bid), ValidationError, errorMessage)
  })
})
