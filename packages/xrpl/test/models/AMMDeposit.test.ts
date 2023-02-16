/* eslint-disable no-bitwise -- bitwise necessary for enabling flags */
import { assert } from 'chai'

import { AMMDepositFlags, validate, ValidationError } from '../../src'

/**
 * AMMDeposit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMDeposit', function () {
  const LPTokenOut = {
    currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
    issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
    value: '1000',
  }
  let deposit

  beforeEach(function () {
    deposit = {
      TransactionType: 'AMMDeposit',
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

  it(`verifies valid AMMDeposit with LPTokenOut`, function () {
    deposit.LPTokenOut = LPTokenOut
    deposit.Flags |= AMMDepositFlags.tfLPToken
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Amount`, function () {
    deposit.Amount = '1000'
    deposit.Flags |= AMMDepositFlags.tfSingleAsset
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Amount and Amount2`, function () {
    deposit.Amount = '1000'
    deposit.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    deposit.Flags |= AMMDepositFlags.tfTwoAsset
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Amount and LPTokenOut`, function () {
    deposit.Amount = '1000'
    deposit.LPTokenOut = LPTokenOut
    deposit.Flags |= AMMDepositFlags.tfOneAssetLPToken
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`verifies valid AMMDeposit with Amount and EPrice`, function () {
    deposit.Amount = '1000'
    deposit.EPrice = '25'
    deposit.Flags |= AMMDepositFlags.tfLimitLPToken
    assert.doesNotThrow(() => validate(deposit))
  })

  it(`throws w/ missing field Asset`, function () {
    delete deposit.Asset
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: missing field Asset',
    )
  })

  it(`throws w/ Asset must be an Issue`, function () {
    deposit.Asset = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: Asset must be an Issue',
    )
  })

  it(`throws w/ missing field Asset2`, function () {
    delete deposit.Asset2
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: missing field Asset2',
    )
  })

  it(`throws w/ Asset2 must be an Issue`, function () {
    deposit.Asset2 = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: Asset2 must be an Issue',
    )
  })

  it(`throws w/ must set at least LPTokenOut or Amount`, function () {
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: must set at least LPTokenOut or Amount',
    )
  })

  it(`throws w/ must set Amount with Amount2`, function () {
    deposit.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: must set Amount with Amount2',
    )
  })

  it(`throws w/ must set Amount with EPrice`, function () {
    deposit.EPrice = '25'
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: must set Amount with EPrice',
    )
  })

  it(`throws w/ LPTokenOut must be an IssuedCurrencyAmount`, function () {
    deposit.LPTokenOut = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: LPTokenOut must be an IssuedCurrencyAmount',
    )
  })

  it(`throws w/ Amount must be an Amount`, function () {
    deposit.Amount = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: Amount must be an Amount',
    )
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    deposit.Amount = '1000'
    deposit.Amount2 = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: Amount2 must be an Amount',
    )
  })

  it(`throws w/ EPrice must be an Amount`, function () {
    deposit.Amount = '1000'
    deposit.EPrice = 1234
    assert.throws(
      () => validate(deposit),
      ValidationError,
      'AMMDeposit: EPrice must be an Amount',
    )
  })
})
