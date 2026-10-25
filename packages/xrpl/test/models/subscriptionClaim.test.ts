import { SubscriptionClaim } from '../../src/models/transactions'
import { validateSubscriptionClaim } from '../../src/models/transactions/subscriptionClaim'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSubscriptionClaim)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSubscriptionClaim, message)

/**
 * SubscriptionClaim Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SubscriptionClaim', function () {
  let tx: SubscriptionClaim

  beforeEach(function () {
    tx = {
      TransactionType: 'SubscriptionClaim',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      SubscriptionID:
        'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321',
      Amount: '1000000',
    }
  })

  it('verifies valid SubscriptionClaim', function () {
    assertValid(tx)
  })

  it('verifies IOU and MPT Amounts', function () {
    tx.Amount = {
      currency: 'USD',
      issuer: 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n',
      value: '10',
    }
    assertValid(tx)
    tx.Amount = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      value: '10',
    }
    assertValid(tx)
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'SubscriptionClaim: invalid Flags')
  })

  it('throws w/ missing SubscriptionID', function () {
    // @ts-expect-error for test
    delete tx.SubscriptionID
    assertInvalid(tx, 'SubscriptionClaim: missing field SubscriptionID')
  })

  it('throws w/ invalid SubscriptionID', function () {
    tx.SubscriptionID = 'ABCD'
    assertInvalid(tx, 'SubscriptionClaim: invalid field SubscriptionID')
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    delete tx.Amount
    assertInvalid(tx, 'SubscriptionClaim: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    // @ts-expect-error for test
    tx.Amount = 1000000
    assertInvalid(tx, 'SubscriptionClaim: invalid field Amount')
  })
})
