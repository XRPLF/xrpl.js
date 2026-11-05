import { PerpLiquidate } from '../../src/models/transactions'
import {
  PerpLiquidateFlags,
  validatePerpLiquidate,
} from '../../src/models/transactions/perpLiquidate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpLiquidate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpLiquidate, message)

const EXACTLY_ONE_MODE =
  'PerpLiquidate: exactly one of tfPerpLiquidateToBook and tfPerpLiquidateTakeover must be set'

/**
 * PerpLiquidate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpLiquidate', function () {
  let tx: PerpLiquidate

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpLiquidate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarginAccountID:
        'AB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      MarketID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      Size: '1.5',
      Flags: PerpLiquidateFlags.tfPerpLiquidateToBook,
    }
  })

  it('verifies valid PerpLiquidate in book mode', function () {
    assertValid(tx)
  })

  it('verifies valid PerpLiquidate in takeover mode', function () {
    tx.Flags = { tfPerpLiquidateTakeover: true }
    assertValid(tx)
  })

  it('throws w/ missing MarginAccountID', function () {
    // @ts-expect-error for test
    tx.MarginAccountID = undefined
    assertInvalid(tx, 'PerpLiquidate: missing field MarginAccountID')
  })

  it('throws w/ missing MarketID', function () {
    // @ts-expect-error for test
    tx.MarketID = undefined
    assertInvalid(tx, 'PerpLiquidate: missing field MarketID')
  })

  it('throws w/ invalid Size', function () {
    // @ts-expect-error for test
    tx.Size = 1.5
    assertInvalid(tx, 'PerpLiquidate: invalid field Size')
  })

  it('throws w/ neither mode flag', function () {
    delete tx.Flags
    assertInvalid(tx, EXACTLY_ONE_MODE)
  })

  it('throws w/ both mode flags', function () {
    tx.Flags = {
      tfPerpLiquidateToBook: true,
      tfPerpLiquidateTakeover: true,
    }
    assertInvalid(tx, EXACTLY_ONE_MODE)
  })
})
