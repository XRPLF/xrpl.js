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
      FeeVal: 25,
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

  it(`throws w/ missing field FeeVal`, function () {
    delete vote.FeeVal
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: missing field FeeVal',
    )
  })

  it(`throws w/ FeeVal must be a number`, function () {
    vote.FeeVal = '25'
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: FeeVal must be a number',
    )
  })

  it(`throws w/ FeeVal must not be greater than 65000`, function () {
    vote.FeeVal = 65001
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: FeeVal must not be greater than 65000',
    )
  })
})
