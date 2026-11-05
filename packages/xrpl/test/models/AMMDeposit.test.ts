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
    const errorMessage = 'AMMDeposit: invalid field Asset'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete deposit.Asset2
    const errorMessage = 'AMMDeposit: missing field Asset2'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    deposit.Asset2 = 1234
    const errorMessage = 'AMMDeposit: invalid field Asset2'
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
    const errorMessage = 'AMMDeposit: invalid field LPTokenOut'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Amount must be an Amount`, function () {
    deposit.Amount = 1234
    const errorMessage = 'AMMDeposit: invalid field Amount'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    deposit.Amount = '1000'
    deposit.Amount2 = 1234
    const errorMessage = 'AMMDeposit: invalid field Amount2'
    assertInvalid(deposit, errorMessage)
  })

  it(`throws w/ EPrice must be an Amount`, function () {
    deposit.Amount = '1000'
    deposit.EPrice = 1234
    const errorMessage = 'AMMDeposit: invalid field EPrice'
    assertInvalid(deposit, errorMessage)
  })

  describe('CurveType', function () {
    beforeEach(function () {
      deposit.Amount = '1000'
      deposit.Amount2 = {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
        value: '2.5',
      }
      deposit.Flags = AMMDepositFlags.tfTwoAsset
    })

    it(`verifies valid concentrated liquidity tfTwoAsset deposit`, function () {
      deposit.CurveType = 1
      deposit.TickLower = -60
      deposit.TickUpper = 60
      assertValid(deposit)
    })

    it(`verifies valid concentrated liquidity tfSingleAsset deposit`, function () {
      delete deposit.Amount2
      deposit.Flags = { tfSingleAsset: true }
      deposit.CurveType = 1
      deposit.TickLower = -887272
      deposit.TickUpper = 887272
      assertValid(deposit)
    })

    it(`verifies valid binned deposit`, function () {
      deposit.CurveType = 3
      deposit.BinID = -221818
      assertValid(deposit)
    })

    it(`verifies valid StableSwap deposit`, function () {
      deposit.CurveType = 2
      assertValid(deposit)
    })

    it(`throws w/ invalid CurveType`, function () {
      deposit.CurveType = '1'
      assertInvalid(deposit, 'AMMDeposit: invalid field CurveType')
    })

    it(`throws w/ invalid TickLower`, function () {
      deposit.CurveType = 1
      deposit.TickLower = '-60'
      deposit.TickUpper = 60
      assertInvalid(deposit, 'AMMDeposit: invalid field TickLower')
    })

    it(`throws w/ invalid TickUpper`, function () {
      deposit.CurveType = 1
      deposit.TickLower = -60
      deposit.TickUpper = '60'
      assertInvalid(deposit, 'AMMDeposit: invalid field TickUpper')
    })

    it(`throws w/ invalid BinID`, function () {
      deposit.CurveType = 3
      deposit.BinID = '0'
      assertInvalid(deposit, 'AMMDeposit: invalid field BinID')
    })

    it(`throws w/ concentrated liquidity and tfLPToken`, function () {
      deposit.Flags = AMMDepositFlags.tfLPToken
      deposit.CurveType = 1
      deposit.TickLower = -60
      deposit.TickUpper = 60
      assertInvalid(
        deposit,
        'AMMDeposit: CurveType 1 requires the tfTwoAsset or tfSingleAsset flag',
      )
    })

    it(`throws w/ concentrated liquidity and no flag`, function () {
      deposit.Flags = 0
      deposit.CurveType = 1
      deposit.TickLower = -60
      deposit.TickUpper = 60
      assertInvalid(
        deposit,
        'AMMDeposit: CurveType 1 requires the tfTwoAsset or tfSingleAsset flag',
      )
    })

    it(`throws w/ concentrated liquidity and no TickUpper`, function () {
      deposit.CurveType = 1
      deposit.TickLower = -60
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower and TickUpper are required when CurveType is 1',
      )
    })

    it(`throws w/ TickLower not below TickUpper`, function () {
      deposit.CurveType = 1
      deposit.TickLower = 60
      deposit.TickUpper = 60
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower must be less than TickUpper',
      )
    })

    it(`throws w/ TickLower below the minimum tick`, function () {
      deposit.CurveType = 1
      deposit.TickLower = -887273
      deposit.TickUpper = 60
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower and TickUpper must be between -887272 and 887272',
      )
    })

    it(`throws w/ TickUpper above the maximum tick`, function () {
      deposit.CurveType = 1
      deposit.TickLower = -60
      deposit.TickUpper = 887273
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower and TickUpper must be between -887272 and 887272',
      )
    })

    it(`throws w/ binned and tfSingleAsset`, function () {
      delete deposit.Amount2
      deposit.Flags = AMMDepositFlags.tfSingleAsset
      deposit.CurveType = 3
      deposit.BinID = 0
      assertInvalid(
        deposit,
        'AMMDeposit: CurveType 3 requires the tfTwoAsset flag',
      )
    })

    it(`throws w/ binned and no BinID`, function () {
      deposit.CurveType = 3
      assertInvalid(
        deposit,
        'AMMDeposit: BinID is required when CurveType is 3',
      )
    })

    it(`throws w/ binned and BinID out of range`, function () {
      deposit.CurveType = 3
      deposit.BinID = 221819
      assertInvalid(
        deposit,
        'AMMDeposit: BinID must be between -221818 and 221818',
      )
    })

    it(`throws w/ binned and a tick field`, function () {
      deposit.CurveType = 3
      deposit.BinID = 0
      deposit.TickLower = -60
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower and TickUpper are not allowed when CurveType is 3',
      )
    })

    it(`throws w/ a tick field and no CurveType`, function () {
      deposit.TickUpper = 60
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower, TickUpper and BinID are only allowed when CurveType is 1 or 3',
      )
    })

    it(`throws w/ BinID and StableSwap`, function () {
      deposit.CurveType = 2
      deposit.BinID = 0
      assertInvalid(
        deposit,
        'AMMDeposit: TickLower, TickUpper and BinID are only allowed when CurveType is 1 or 3',
      )
    })
  })
})
