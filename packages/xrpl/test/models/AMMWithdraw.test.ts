/* eslint-disable no-bitwise -- bitwise necessary for enabling flags */
import { assert } from 'chai'

import { AMMWithdrawFlags, validate, ValidationError } from '../../src'
import { validateAMMWithdraw } from '../../src/models/transactions/AMMWithdraw'

/**
 * AMMWithdraw Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMWithdraw', function () {
  const LPTokenIn = {
    currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
    issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
    value: '1000',
  }
  let withdraw

  beforeEach(function () {
    withdraw = {
      TransactionType: 'AMMWithdraw',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      },
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid AMMWithdraw with LPTokenIn`, function () {
    withdraw.LPTokenIn = LPTokenIn
    withdraw.Flags |= AMMWithdrawFlags.tfLPToken
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Amount`, function () {
    withdraw.Amount = '1000'
    withdraw.Flags |= AMMWithdrawFlags.tfSingleAsset
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Amount and Amount2`, function () {
    withdraw.Amount = '1000'
    withdraw.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    withdraw.Flags |= AMMWithdrawFlags.tfTwoAsset
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Amount and LPTokenIn`, function () {
    withdraw.Amount = '1000'
    withdraw.LPTokenIn = LPTokenIn
    withdraw.Flags |= AMMWithdrawFlags.tfOneAssetLPToken
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw with Amount and EPrice`, function () {
    withdraw.Amount = '1000'
    withdraw.EPrice = '25'
    withdraw.Flags |= AMMWithdrawFlags.tfLimitLPToken
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw one asset withdraw all`, function () {
    withdraw.Amount = '1000'
    withdraw.Flags |= AMMWithdrawFlags.tfOneAssetWithdrawAll
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`verifies valid AMMWithdraw withdraw all`, function () {
    withdraw.Flags |= AMMWithdrawFlags.tfWithdrawAll
    assert.doesNotThrow(() => validateAMMWithdraw(withdraw))
    assert.doesNotThrow(() => validate(withdraw))
  })

  it(`throws w/ missing field Asset`, function () {
    delete withdraw.Asset
    const errorMessage = 'AMMWithdraw: missing field Asset'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    withdraw.Asset = 1234
    const errorMessage = 'AMMWithdraw: Asset must be a Currency'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete withdraw.Asset2
    const errorMessage = 'AMMWithdraw: missing field Asset2'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    withdraw.Asset2 = 1234
    const errorMessage = 'AMMWithdraw: Asset2 must be a Currency'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ must set Amount with Amount2`, function () {
    withdraw.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    const errorMessage = 'AMMWithdraw: must set Amount with Amount2'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ must set Amount with EPrice`, function () {
    withdraw.EPrice = '25'
    const errorMessage = 'AMMWithdraw: must set Amount with EPrice'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ LPTokenIn must be an IssuedCurrencyAmount`, function () {
    withdraw.LPTokenIn = 1234
    const errorMessage =
      'AMMWithdraw: LPTokenIn must be an IssuedCurrencyAmount'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ Amount must be an Amount`, function () {
    withdraw.Amount = 1234
    const errorMessage = 'AMMWithdraw: Amount must be an Amount'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    withdraw.Amount = '1000'
    withdraw.Amount2 = 1234
    const errorMessage = 'AMMWithdraw: Amount2 must be an Amount'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })

  it(`throws w/ EPrice must be an Amount`, function () {
    withdraw.Amount = '1000'
    withdraw.EPrice = 1234
    const errorMessage = 'AMMWithdraw: EPrice must be an Amount'
    assert.throws(
      () => validateAMMWithdraw(withdraw),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(withdraw), ValidationError, errorMessage)
  })
})
