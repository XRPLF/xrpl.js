import { PerpExchangeDelete } from '../../src/models/transactions'
import { validatePerpExchangeDelete } from '../../src/models/transactions/perpExchangeDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpExchangeDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpExchangeDelete, message)

/**
 * PerpExchangeDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpExchangeDelete', function () {
  let tx: PerpExchangeDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpExchangeDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
    }
  })

  it('verifies valid PerpExchangeDelete', function () {
    assertValid(tx)
  })

  it('throws w/ missing ExchangeID', function () {
    // @ts-expect-error for test
    tx.ExchangeID = undefined
    assertInvalid(tx, 'PerpExchangeDelete: missing field ExchangeID')
  })

  it('throws w/ invalid ExchangeID', function () {
    // @ts-expect-error for test
    tx.ExchangeID = 1234
    assertInvalid(tx, 'PerpExchangeDelete: invalid field ExchangeID')
  })
})
