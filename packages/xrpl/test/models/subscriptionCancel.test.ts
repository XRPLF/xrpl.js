import { SubscriptionCancel } from '../../src/models/transactions'
import { validateSubscriptionCancel } from '../../src/models/transactions/subscriptionCancel'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSubscriptionCancel)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSubscriptionCancel, message)

/**
 * SubscriptionCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SubscriptionCancel', function () {
  let tx: SubscriptionCancel

  beforeEach(function () {
    tx = {
      TransactionType: 'SubscriptionCancel',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      SubscriptionID:
        'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321',
    }
  })

  it('verifies valid SubscriptionCancel', function () {
    assertValid(tx)
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'SubscriptionCancel: invalid Flags')
  })

  it('throws w/ missing SubscriptionID', function () {
    // @ts-expect-error for test
    delete tx.SubscriptionID
    assertInvalid(tx, 'SubscriptionCancel: missing field SubscriptionID')
  })

  it('throws w/ invalid SubscriptionID', function () {
    tx.SubscriptionID = 'ABCD'
    assertInvalid(tx, 'SubscriptionCancel: invalid field SubscriptionID')
  })
})
