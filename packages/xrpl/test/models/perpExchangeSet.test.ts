import { PerpExchangeSet } from '../../src/models/transactions'
import { validatePerpExchangeSet } from '../../src/models/transactions/perpExchangeSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpExchangeSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpExchangeSet, message)

const EXCHANGE_ID =
  'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'

/**
 * PerpExchangeSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpExchangeSet', function () {
  let tx: PerpExchangeSet

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpExchangeSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Asset: {
        currency: 'USD',
        issuer: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      },
      Scale: 6,
      DomainID:
        'AB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      MakerFee: 100,
      TakerFee: 300,
      OwnerFeeShare: 20000,
      BuilderFeeMax: 500,
      CoverRateMinimum: 1000,
      LiquidationPenalty: 1000,
      LiquidationRewardMin: '1',
      LiquidationChunkMin: '10000',
      Data: 'ABCD',
    }
  })

  it('verifies valid PerpExchangeSet creation', function () {
    assertValid(tx)
  })

  it('verifies valid PerpExchangeSet update', function () {
    tx = {
      TransactionType: 'PerpExchangeSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID: EXCHANGE_ID,
      TakerFee: 250,
      LiquidationPenalty: 2000,
      Data: 'ABCD',
    }
    assertValid(tx)
  })

  it('throws w/ creation missing Asset', function () {
    delete tx.Asset
    assertInvalid(tx, 'PerpExchangeSet: missing field Asset')
  })

  it('throws w/ creation missing LiquidationPenalty', function () {
    delete tx.LiquidationPenalty
    assertInvalid(tx, 'PerpExchangeSet: missing field LiquidationPenalty')
  })

  it('throws w/ creation missing LiquidationChunkMin', function () {
    delete tx.LiquidationChunkMin
    assertInvalid(tx, 'PerpExchangeSet: missing field LiquidationChunkMin')
  })

  it('throws w/ invalid LiquidationChunkMin', function () {
    // @ts-expect-error for test
    tx.LiquidationChunkMin = 10000
    assertInvalid(tx, 'PerpExchangeSet: invalid field LiquidationChunkMin')
  })

  it('throws w/ invalid LiquidationPenalty', function () {
    // @ts-expect-error for test
    tx.LiquidationPenalty = '1000'
    assertInvalid(tx, 'PerpExchangeSet: invalid field LiquidationPenalty')
  })

  it('throws w/ invalid MakerFee', function () {
    // @ts-expect-error for test
    tx.MakerFee = '100'
    assertInvalid(tx, 'PerpExchangeSet: invalid field MakerFee')
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 'USD'
    assertInvalid(tx, 'PerpExchangeSet: invalid field Asset')
  })

  it('throws w/ Data that is not hex', function () {
    tx.Data = 'not hex'
    assertInvalid(tx, 'PerpExchangeSet: invalid field Data')
  })

  it('throws w/ OwnerFeeShare above 100000', function () {
    tx.OwnerFeeShare = 100001
    assertInvalid(tx, 'PerpExchangeSet: OwnerFeeShare must not exceed 100000')
  })

  it.each([
    ['MakerFee', 10000],
    ['TakerFee', 10000],
    ['BuilderFeeMax', 10000],
    ['CoverRateMinimum', 100000],
    ['LiquidationPenalty', 100000],
  ])('verifies %s at its cap of %i', function (field, cap) {
    assertValid({ ...tx, [field]: cap })
  })

  it.each([
    ['MakerFee', 10000],
    ['TakerFee', 10000],
    ['BuilderFeeMax', 10000],
    ['CoverRateMinimum', 100000],
    ['LiquidationPenalty', 100000],
  ])('throws w/ %s above %i', function (field, cap) {
    assertInvalid(
      { ...tx, [field]: cap + 1 },
      `PerpExchangeSet: ${field} must not exceed ${cap}`,
    )
  })

  it('throws w/ an update that changes a creation-only field', function () {
    tx.ExchangeID = EXCHANGE_ID
    assertInvalid(tx, 'PerpExchangeSet: Asset can only be set on creation')
  })

  it('throws w/ an update that changes LiquidationChunkMin', function () {
    tx = {
      TransactionType: 'PerpExchangeSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID: EXCHANGE_ID,
      LiquidationChunkMin: '20000',
    }
    assertInvalid(
      tx,
      'PerpExchangeSet: LiquidationChunkMin can only be set on creation',
    )
  })

  it('throws w/ an update that changes LiquidationRewardMin', function () {
    tx = {
      TransactionType: 'PerpExchangeSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID: EXCHANGE_ID,
      LiquidationRewardMin: '2',
    }
    assertInvalid(
      tx,
      'PerpExchangeSet: LiquidationRewardMin can only be set on creation',
    )
  })
})
