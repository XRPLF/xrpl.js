import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMDeposit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMDeposit', function () {
  it(`verifies valid AMMDeposit with LPToken`, function () {
    const validTx = {
      TransactionType: 'AMMDeposit',
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

  it(`verifies valid AMMDeposit with Asset1In`, function () {
    const validTx = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset1In: '1000',
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`verifies valid AMMDeposit with Asset1In and LPToken`, function () {
    const validTx = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset1In: '1000',
      LPToken: {
        currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
        issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
        value: '1000',
      },
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`verifies valid AMMDeposit with Asset1In and EPrice`, function () {
    const validTx = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset1In: '1000',
      EPrice: '25',
      Sequence: 1337,
    } as any

    assert.doesNotThrow(() => validate(validTx))
  })

  it(`throws w/ missing AMMID`, function () {
    const invalid = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset1In: '1000',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMDeposit: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    const invalid = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: 1234,
      Asset1In: '1000',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMDeposit: AMMID must be a string',
    )
  })

  it(`throws w/ must set either or both LPToken with Asset1In`, function () {
    const invalid = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMDeposit: must set either or both LPToken with Asset1In',
    )
  })

  it(`throws w/ must set Asset1In with Asset2In`, function () {
    const invalid = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Asset2In: '500',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMDeposit: must set Asset1In with Asset2In',
    )
  })

  it(`throws w/ must set Asset1In with EPrice`, function () {
    const invalid = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      EPrice: '25',
      Sequence: 1337,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'AMMDeposit: must set Asset1In with EPrice',
    )
  })
})
