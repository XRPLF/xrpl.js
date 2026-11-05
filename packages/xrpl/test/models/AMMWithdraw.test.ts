/* eslint-disable no-bitwise -- bitwise necessary for enabling flags */

import { AMMWithdrawFlags } from '../../src'
import { validateAMMWithdraw } from '../../src/models/transactions/AMMWithdraw'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMWithdraw)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMWithdraw, message)

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
  let withdraw: any

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
    assertValid(withdraw)
  })

  it(`verifies valid AMMWithdraw with Amount`, function () {
    withdraw.Amount = '1000'
    withdraw.Flags |= AMMWithdrawFlags.tfSingleAsset
    assertValid(withdraw)
  })

  it(`verifies valid AMMWithdraw with Amount and Amount2`, function () {
    withdraw.Amount = '1000'
    withdraw.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    withdraw.Flags |= AMMWithdrawFlags.tfTwoAsset
    assertValid(withdraw)
  })

  it(`verifies valid AMMWithdraw with Amount and LPTokenIn`, function () {
    withdraw.Amount = '1000'
    withdraw.LPTokenIn = LPTokenIn
    withdraw.Flags |= AMMWithdrawFlags.tfOneAssetLPToken
    assertValid(withdraw)
  })

  it(`verifies valid AMMWithdraw with Amount and EPrice`, function () {
    withdraw.Amount = '1000'
    withdraw.EPrice = '25'
    withdraw.Flags |= AMMWithdrawFlags.tfLimitLPToken
    assertValid(withdraw)
  })

  it(`verifies valid AMMWithdraw one asset withdraw all`, function () {
    withdraw.Amount = '1000'
    withdraw.Flags |= AMMWithdrawFlags.tfOneAssetWithdrawAll
    assertValid(withdraw)
  })

  it(`verifies valid AMMWithdraw withdraw all`, function () {
    withdraw.Flags |= AMMWithdrawFlags.tfWithdrawAll
    assertValid(withdraw)
  })

  it(`throws w/ missing field Asset`, function () {
    delete withdraw.Asset
    const errorMessage = 'AMMWithdraw: missing field Asset'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    withdraw.Asset = 1234
    const errorMessage = 'AMMWithdraw: invalid field Asset'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete withdraw.Asset2
    const errorMessage = 'AMMWithdraw: missing field Asset2'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    withdraw.Asset2 = 1234
    const errorMessage = 'AMMWithdraw: invalid field Asset2'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ must set Amount with Amount2`, function () {
    withdraw.Amount2 = {
      currency: 'ETH',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      value: '2.5',
    }
    const errorMessage = 'AMMWithdraw: must set Amount with Amount2'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ must set Amount with EPrice`, function () {
    withdraw.EPrice = '25'
    const errorMessage = 'AMMWithdraw: must set Amount with EPrice'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ LPTokenIn must be an IssuedCurrencyAmount`, function () {
    withdraw.LPTokenIn = 1234
    const errorMessage = 'AMMWithdraw: invalid field LPTokenIn'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ Amount must be an Amount`, function () {
    withdraw.Amount = 1234
    const errorMessage = 'AMMWithdraw: invalid field Amount'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    withdraw.Amount = '1000'
    withdraw.Amount2 = 1234
    const errorMessage = 'AMMWithdraw: invalid field Amount2'
    assertInvalid(withdraw, errorMessage)
  })

  it(`throws w/ EPrice must be an Amount`, function () {
    withdraw.Amount = '1000'
    withdraw.EPrice = 1234
    const errorMessage = 'AMMWithdraw: invalid field EPrice'
    assertInvalid(withdraw, errorMessage)
  })

  describe('CurveType', function () {
    const positionID =
      'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'

    it(`verifies valid concentrated liquidity withdrawal`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 1
      withdraw.PositionID = positionID
      withdraw.PositionLiquidity = '2710'
      assertValid(withdraw)
    })

    it(`verifies valid binned withdrawal of all shares`, function () {
      withdraw.Flags = { tfWithdrawAll: true }
      withdraw.CurveType = 3
      withdraw.BinID = 221818
      assertValid(withdraw)
    })

    it(`verifies valid binned withdrawal of some shares`, function () {
      withdraw.CurveType = 3
      withdraw.BinID = -5
      withdraw.Shares = '40'
      assertValid(withdraw)
    })

    it(`verifies valid StableSwap withdrawal`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 2
      assertValid(withdraw)
    })

    it(`throws w/ invalid CurveType`, function () {
      withdraw.CurveType = '1'
      assertInvalid(withdraw, 'AMMWithdraw: invalid field CurveType')
    })

    it(`throws w/ invalid PositionID`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 1
      withdraw.PositionID = 'ABCD'
      assertInvalid(withdraw, 'AMMWithdraw: invalid field PositionID')
    })

    it(`throws w/ invalid PositionLiquidity`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 1
      withdraw.PositionID = positionID
      withdraw.PositionLiquidity = 10000
      assertInvalid(withdraw, 'AMMWithdraw: invalid field PositionLiquidity')
    })

    it(`throws w/ PositionLiquidity longer than 64 bits`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 1
      withdraw.PositionID = positionID
      withdraw.PositionLiquidity = '10000000000000000'
      assertInvalid(withdraw, 'AMMWithdraw: invalid field PositionLiquidity')
    })

    it(`throws w/ invalid BinID`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 3
      withdraw.BinID = '1'
      assertInvalid(withdraw, 'AMMWithdraw: invalid field BinID')
    })

    it(`throws w/ invalid Shares`, function () {
      withdraw.CurveType = 3
      withdraw.BinID = 1
      withdraw.Shares = 'shares'
      assertInvalid(withdraw, 'AMMWithdraw: invalid field Shares')
    })

    it(`throws w/ concentrated liquidity and not tfWithdrawAll`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfLPToken
      withdraw.CurveType = 1
      withdraw.PositionID = positionID
      assertInvalid(
        withdraw,
        'AMMWithdraw: CurveType 1 requires the tfWithdrawAll flag',
      )
    })

    it(`throws w/ concentrated liquidity and no PositionID`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 1
      assertInvalid(
        withdraw,
        'AMMWithdraw: PositionID is required when CurveType is 1',
      )
    })

    it(`throws w/ concentrated liquidity and LPTokenIn`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 1
      withdraw.PositionID = positionID
      withdraw.LPTokenIn = {
        currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
        issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
        value: '1000',
      }
      assertInvalid(
        withdraw,
        'AMMWithdraw: Amount, Amount2, EPrice and LPTokenIn are not allowed when CurveType is 1',
      )
    })

    it(`throws w/ binned, tfWithdrawAll and Shares`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 3
      withdraw.BinID = 1
      withdraw.Shares = '40'
      assertInvalid(
        withdraw,
        'AMMWithdraw: CurveType 3 requires exactly one of the tfWithdrawAll flag or Shares',
      )
    })

    it(`throws w/ binned, no flag and no Shares`, function () {
      withdraw.CurveType = 3
      withdraw.BinID = 1
      assertInvalid(
        withdraw,
        'AMMWithdraw: CurveType 3 requires exactly one of the tfWithdrawAll flag or Shares',
      )
    })

    it(`throws w/ binned, Shares and another withdrawal flag`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfLPToken
      withdraw.CurveType = 3
      withdraw.BinID = 1
      withdraw.Shares = '40'
      assertInvalid(
        withdraw,
        'AMMWithdraw: CurveType 3 requires exactly one of the tfWithdrawAll flag or Shares',
      )
    })

    it(`throws w/ binned and no BinID`, function () {
      withdraw.CurveType = 3
      withdraw.Shares = '40'
      assertInvalid(
        withdraw,
        'AMMWithdraw: BinID is required when CurveType is 3',
      )
    })

    it(`throws w/ binned and Amount`, function () {
      withdraw.CurveType = 3
      withdraw.BinID = 1
      withdraw.Shares = '40'
      withdraw.Amount = '1000'
      assertInvalid(
        withdraw,
        'AMMWithdraw: Amount, Amount2, EPrice and LPTokenIn are not allowed when CurveType is 3',
      )
    })

    it(`throws w/ binned and zero Shares`, function () {
      withdraw.CurveType = 3
      withdraw.BinID = 1
      withdraw.Shares = '0'
      assertInvalid(withdraw, 'AMMWithdraw: Shares must not be zero')
    })

    it(`throws w/ binned and BinID out of range`, function () {
      withdraw.CurveType = 3
      withdraw.BinID = -221819
      withdraw.Shares = '40'
      assertInvalid(
        withdraw,
        'AMMWithdraw: BinID must be between -221818 and 221818',
      )
    })

    it(`throws w/ PositionID and no CurveType`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.PositionID = positionID
      assertInvalid(
        withdraw,
        'AMMWithdraw: PositionID, PositionLiquidity and BinID are only allowed when CurveType is 1 or 3',
      )
    })

    it(`throws w/ PositionLiquidity and StableSwap`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 2
      withdraw.PositionLiquidity = '10'
      assertInvalid(
        withdraw,
        'AMMWithdraw: PositionID, PositionLiquidity and BinID are only allowed when CurveType is 1 or 3',
      )
    })

    it(`throws w/ BinID and constant product`, function () {
      withdraw.Flags = AMMWithdrawFlags.tfWithdrawAll
      withdraw.CurveType = 0
      withdraw.BinID = 1
      assertInvalid(
        withdraw,
        'AMMWithdraw: PositionID, PositionLiquidity and BinID are only allowed when CurveType is 1 or 3',
      )
    })
  })
})
