import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMVote Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMVote', function () {
  it(`verifies valid AMMVote`, function () {
    const validTx = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      FeeVal: 25,
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`throws w/ missing field AMMID`, function () {
    const invalid = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      FeeVal: 25,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMVote: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    const invalid = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: 1234,
      FeeVal: 25,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMVote: AMMID must be a string',
    )
  })

  it(`throws w/ missing field FeeVal`, function () {
    const invalid = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMVote: missing field FeeVal',
    )
  })

  it(`throws w/ FeeVal must be a number`, function () {
    const invalid = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      FeeVal: '25',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMVote: FeeVal must be a number',
    )
  })

  it(`throws w/ FeeVal must not be greater than 65000`, function () {
    const invalid = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      FeeVal: 65001,
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMVote: FeeVal must not be greater than 65000',
    )
  })
})
