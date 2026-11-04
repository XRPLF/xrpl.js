import { PerpRefresh } from '../../src/models/transactions'
import {
  PerpRefreshFlags,
  validatePerpRefresh,
} from '../../src/models/transactions/perpRefresh'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validatePerpRefresh)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpRefresh, message)

const MARKET_ID =
  'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'
const MARGIN_ACCOUNT_ID =
  'AB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'

/**
 * PerpRefresh Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpRefresh', function () {
  let tx: PerpRefresh

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpRefresh',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID: MARKET_ID,
      MarginAccountID: MARGIN_ACCOUNT_ID,
    }
  })

  it('verifies valid PerpRefresh', function () {
    assertValid(tx)
  })

  it('verifies valid PerpRefresh w/ only MarginAccountID', function () {
    delete tx.MarketID
    assertValid(tx)
  })

  it('verifies valid PerpRefresh w/ tfPerpSettleStale', function () {
    delete tx.MarginAccountID
    tx.Flags = PerpRefreshFlags.tfPerpSettleStale
    assertValid(tx)
  })

  it('throws w/ neither MarketID nor MarginAccountID', function () {
    delete tx.MarketID
    delete tx.MarginAccountID
    assertInvalid(
      tx,
      'PerpRefresh: at least one of MarketID and MarginAccountID must be present',
    )
  })

  it('throws w/ invalid MarketID', function () {
    tx.MarketID = 'ABCDEF'
    assertInvalid(tx, 'PerpRefresh: invalid field MarketID')
  })

  it('throws w/ invalid MarginAccountID', function () {
    // @ts-expect-error for test
    tx.MarginAccountID = 42
    assertInvalid(tx, 'PerpRefresh: invalid field MarginAccountID')
  })

  it('throws w/ tfPerpSettleStale and no MarketID', function () {
    delete tx.MarketID
    tx.Flags = { tfPerpSettleStale: true }
    assertInvalid(tx, 'PerpRefresh: tfPerpSettleStale requires MarketID')
  })
})
