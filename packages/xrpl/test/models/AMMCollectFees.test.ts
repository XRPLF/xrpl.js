import { AMMCollectFees, AMMCurveType } from '../../src/models/transactions'
import { validateAMMCollectFees } from '../../src/models/transactions/AMMCollectFees'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateAMMCollectFees)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMCollectFees, message)

const POSITION_ID =
  'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'

/**
 * AMMCollectFees Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMCollectFees', function () {
  let tx: AMMCollectFees

  beforeEach(function () {
    tx = {
      TransactionType: 'AMMCollectFees',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset: { currency: 'XRP' },
      Asset2: {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      },
      CurveType: AMMCurveType.concentratedLiquidity,
      PositionID: POSITION_ID,
      Sequence: 1337,
    }
  })

  it('verifies valid AMMCollectFees for a position', function () {
    assertValid(tx)
  })

  it('verifies valid AMMCollectFees for a bin', function () {
    delete tx.PositionID
    tx.CurveType = AMMCurveType.binned
    tx.BinID = -12
    assertValid(tx)
  })

  it('verifies valid AMMCollectFees with an MPT asset', function () {
    tx.Asset2 = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
    }
    assertValid(tx)
  })

  it('throws w/ missing Asset', function () {
    // @ts-expect-error for test
    tx.Asset = undefined
    assertInvalid(tx, 'AMMCollectFees: missing field Asset')
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 1234
    assertInvalid(tx, 'AMMCollectFees: invalid field Asset')
  })

  it('throws w/ missing Asset2', function () {
    // @ts-expect-error for test
    tx.Asset2 = undefined
    assertInvalid(tx, 'AMMCollectFees: missing field Asset2')
  })

  it('throws w/ invalid Asset2', function () {
    // @ts-expect-error for test
    tx.Asset2 = 1234
    assertInvalid(tx, 'AMMCollectFees: invalid field Asset2')
  })

  it('throws w/ invalid CurveType', function () {
    // @ts-expect-error for test
    tx.CurveType = '1'
    assertInvalid(tx, 'AMMCollectFees: invalid field CurveType')
  })

  it('throws w/ invalid PositionID', function () {
    tx.PositionID = 'ABCD'
    assertInvalid(tx, 'AMMCollectFees: invalid field PositionID')
  })

  it('throws w/ invalid BinID', function () {
    delete tx.PositionID
    // @ts-expect-error for test
    tx.BinID = '5'
    assertInvalid(tx, 'AMMCollectFees: invalid field BinID')
  })

  it('throws w/ both PositionID and BinID', function () {
    tx.BinID = 5
    assertInvalid(
      tx,
      'AMMCollectFees: exactly one of PositionID or BinID is required',
    )
  })

  it('throws w/ neither PositionID nor BinID', function () {
    delete tx.PositionID
    assertInvalid(
      tx,
      'AMMCollectFees: exactly one of PositionID or BinID is required',
    )
  })
})
