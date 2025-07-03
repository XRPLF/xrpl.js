/* eslint-disable no-bitwise -- bitwise necessary for enabling flags */

import { AMMDepositFlags } from '../../src'
import { validateAMMDeposit } from '../../src/models/transactions/AMMDeposit'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMDeposit)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMDeposit, message)

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
  let deposit: any

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
    assertValid(deposit)
  })

  it(`verifies valid AMMDeposit with Amount`, function () {
    deposit.Amount = '1000'
    deposit.Flags |= AMMDepositFlags.tfSingleAsset
    assertValid(deposit)
  })

  it(`verifies valid AMMDeposit with Amount and Amount2`, function () {
    deposit.Amount = '1000'
    deposit.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    deposit.Flags |= AMMDepositFlags.tfTwoAsset
    assertValid(deposit)
  })

  it(`verifies valid AMMDeposit with Amount and LPTokenOut`, function () {
    deposit.Amount = '1000'
    deposit.LPTokenOut = LPTokenOut
    deposit.Flags |= AMMDepositFlags.tfOneAssetLPToken
    assertValid(deposit)
  })

  it(`verifies valid AMMDeposit with Amount and EPrice`, function () {
    deposit.Amount = '1000'
    deposit.EPrice = '25'
    deposit.Flags |= AMMDepositFlags.tfLimitLPToken
    assertValid(deposit)
  })

  it(`throws w/ missing field Asset`, function () {
    delete deposit.Asset
    const errorMessage = 'AMMDeposit: missing field Asset'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    deposit.Asset = 1234
    const errorMessage = 'AMMDeposit: Asset must be a Currency'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete deposit.Asset2
    const errorMessage = 'AMMDeposit: missing field Asset2'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    deposit.Asset2 = 1234
    const errorMessage = 'AMMDeposit: Asset2 must be a Currency'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ must set at least LPTokenOut or Amount`, function () {
    const errorMessage = 'AMMDeposit: must set at least LPTokenOut or Amount'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ must set Amount with Amount2`, function () {
    deposit.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    const errorMessage = 'AMMDeposit: must set Amount with Amount2'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ must set Amount with EPrice`, function () {
    deposit.EPrice = '25'
    const errorMessage = 'AMMDeposit: must set Amount with EPrice'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ LPTokenOut must be an IssuedCurrencyAmount`, function () {
    deposit.LPTokenOut = 1234
    const errorMessage =
      'AMMDeposit: LPTokenOut must be an IssuedCurrencyAmount'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Amount must be an Amount`, function () {
    deposit.Amount = 1234
    const errorMessage = 'AMMDeposit: Amount must be an Amount'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    deposit.Amount = '1000'
    deposit.Amount2 = 1234
    const errorMessage = 'AMMDeposit: Amount2 must be an Amount'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ EPrice must be an Amount`, function () {
    deposit.Amount = '1000'
    deposit.EPrice = 1234
    const errorMessage = 'AMMDeposit: EPrice must be an Amount'
    assertInvalid(deposit, errorMessage)
  })
})
