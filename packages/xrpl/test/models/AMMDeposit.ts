import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMDeposit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMDeposit', function () {
  const LPToken = {
    currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
    issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
    value: '1000',
  }
  let deposit

  beforeEach(function () {
    deposit = {
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      AMMID: '24BA86F99302CF124AB27311C831F5BFAA72C4625DDA65B7EDF346A60CC19883',
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMDeposit with LPToken`, function () {
    deposit.LPToken = LPToken
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Asset1In`, function () {
    deposit.Asset1In = '1000'
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Asset1In and LPToken`, function () {
    deposit.Asset1In = '1000'
    deposit.LPToken = LPToken
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Asset1In and EPrice`, function () {
    deposit.Asset1In = '1000'
    deposit.EPrice = '25'
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`throws w/ missing AMMID`, function () {
    delete deposit.AMMID
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: missing field AMMID',
    )
  })

  it(`throws w/ AMMID must be a string`, function () {
    deposit.AMMID = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: AMMID must be a string',
    )
  })

  it(`throws w/ must set either or both LPToken with Asset1In`, function () {
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: must set either or both LPToken with Asset1In',
    )
  })

  it(`throws w/ must set Asset1In with Asset2In`, function () {
    deposit.Asset2In = '500'
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: must set Asset1In with Asset2In',
    )
  })

  it(`throws w/ must set Asset1In with EPrice`, function () {
    deposit.EPrice = '25'
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: must set Asset1In with EPrice',
    )
  })

  it(`throws w/ LPToken must be an IssuedCurrencyAmount`, function () {
    deposit.LPToken = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: LPToken must be an IssuedCurrencyAmount',
    )
  })

  it(`throws w/ Asset1In must be an Amount`, function () {
    deposit.Asset1In = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: Asset1In must be an Amount',
    )
  })

  it(`throws w/ Asset2In must be an Amount`, function () {
    deposit.Asset1In = '1000'
    deposit.Asset2In = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: Asset2In must be an Amount',
    )
  })

  it(`throws w/ EPrice must be an Amount`, function () {
    deposit.Asset1In = '1000'
    deposit.EPrice = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: EPrice must be an Amount',
    )
  })
})
