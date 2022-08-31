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
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      MinSlotPrice: '5',
      MaxSlotPrice: '10',
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

  it(`throws w/ missing field AMMID`, function () {
    delete bid.AMMID
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    bid.AMMID = 1234
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: AMMID must be a string',
    )
  })

  it(`throws w/ MinSlotPrice must be an Amount`, function () {
    bid.MinSlotPrice = 5
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: MinSlotPrice must be an Amount',
    )
  })

  it(`throws w/ MaxSlotPrice must be an Amount`, function () {
    bid.MaxSlotPrice = 10
    assert.throws(
      () => validate(bid),
      ValidationError,
      'AMMBid: MaxSlotPrice must be an Amount',
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
