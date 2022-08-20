import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMWithdraw Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMWithdraw', function () {
  const LPToken = {
    currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
    issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
    value: '1000',
  }
  let withdraw

  beforeEach(function () {
    withdraw = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMWithdraw with LPToken`, function () {
    withdraw.LPToken = LPToken
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Asset1Out`, function () {
    withdraw.Asset1Out = '1000'
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Asset1Out and LPToken`, function () {
    withdraw.Asset1Out = '1000'
    withdraw.LPToken = LPToken
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Asset1Out and EPrice`, function () {
    withdraw.Asset1Out = '1000'
    withdraw.EPrice = '25'
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`throws w/ missing AMMID`, function () {
    delete withdraw.AMMID
    assert.throws(
      () => validate(withdraw),
      ValidationError,
      'AMMWithdraw: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    withdraw.AMMID = 1234
    assert.throws(
      () => validate(withdraw),
      ValidationError,
      'AMMWithdraw: AMMID must be a string',
    )
  })

  it(`throws w/ must set either or both LPToken with Asset1Out`, function () {
    assert.throws(
      () => validate(withdraw),
      ValidationError,
      'AMMWithdraw: must set either or both LPToken with Asset1Out',
    )
  })

  it(`throws w/ must set Asset1Out with Asset2Out`, function () {
    withdraw.Asset2Out = '500'
    assert.throws(
      () => validate(withdraw),
      ValidationError,
      'AMMWithdraw: must set Asset1Out with Asset2Out',
    )
  })

  it(`throws w/ must set Asset1Out with EPrice`, function () {
    withdraw.EPrice = '25'
    assert.throws(
      () => validate(withdraw),
      ValidationError,
      'AMMWithdraw: must set Asset1Out with EPrice',
    )
  })
})
