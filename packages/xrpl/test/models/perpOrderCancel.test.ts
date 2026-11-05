import { PerpOrderCancel } from '../../src/models/transactions'
import { validatePerpOrderCancel } from '../../src/models/transactions/perpOrderCancel'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpOrderCancel)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpOrderCancel, message)

/**
 * PerpOrderCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpOrderCancel', function () {
  let tx: PerpOrderCancel

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpOrderCancel',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      OfferSequence: 7,
    }
  })

  it('verifies valid PerpOrderCancel', function () {
    assertValid(tx)
  })

  it('verifies valid PerpOrderCancel w/ Owner', function () {
    tx.Owner = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
    assertValid(tx)
  })

  it('throws w/ missing OfferSequence', function () {
    // @ts-expect-error for test
    tx.OfferSequence = undefined
    assertInvalid(tx, 'PerpOrderCancel: missing field OfferSequence')
  })

  it('throws w/ invalid OfferSequence', function () {
    // @ts-expect-error for test
    tx.OfferSequence = '7'
    assertInvalid(tx, 'PerpOrderCancel: invalid field OfferSequence')
  })

  it('throws w/ invalid Owner', function () {
    tx.Owner = 'not-an-account'
    assertInvalid(tx, 'PerpOrderCancel: invalid field Owner')
  })
})
