import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMWithdraw Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMWithdraw', function () {
  it(`verifies valid AMMWithdraw with LPToken`, function () {
    const validTx = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      LPToken: {
        currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
        issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
        value: '1000',
      },
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`verifies valid AMMWithdraw with Asset1Out`, function () {
    const validTx = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset1Out: '1000',
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`verifies valid AMMWithdraw with Asset1Out and LPToken`, function () {
    const validTx = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset1Out: '1000',
      LPToken: {
        currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
        issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
        value: '1000',
      },
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`verifies valid AMMWithdraw with Asset1Out and EPrice`, function () {
    const validTx = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset1Out: '1000',
      EPrice: '25',
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`throws w/ missing AMMID`, function () {
    const invalid = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1Out: '1000',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMWithdraw: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    const invalid = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: 1234,
      Asset1Out: '1000',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMWithdraw: AMMID must be a string',
    )
  })

  it(`throws w/ must set either or both LPToken with Asset1Out`, function () {
    const invalid = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMWithdraw: must set either or both LPToken with Asset1Out',
    )
  })

  it(`throws w/ must set Asset1Out with Asset2Out`, function () {
    const invalid = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset2Out: '500',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMWithdraw: must set Asset1Out with Asset2Out',
    )
  })

  it(`throws w/ must set Asset1Out with EPrice`, function () {
    const invalid = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      EPrice: '25',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMWithdraw: must set Asset1Out with EPrice',
    )
  })
})
