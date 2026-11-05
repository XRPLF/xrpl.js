import { PerpMarketDelete } from '../../src/models/transactions'
import { validatePerpMarketDelete } from '../../src/models/transactions/perpMarketDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpMarketDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpMarketDelete, message)

/**
 * PerpMarketDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpMarketDelete', function () {
  let tx: PerpMarketDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpMarketDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
    }
  })

  it('verifies valid PerpMarketDelete', function () {
    assertValid(tx)
  })

  it('throws w/ missing MarketID', function () {
    // @ts-expect-error for test
    tx.MarketID = undefined
    assertInvalid(tx, 'PerpMarketDelete: missing field MarketID')
  })

  it('throws w/ invalid MarketID', function () {
    // @ts-expect-error for test
    tx.MarketID = 1234
    assertInvalid(tx, 'PerpMarketDelete: invalid field MarketID')
  })
})
