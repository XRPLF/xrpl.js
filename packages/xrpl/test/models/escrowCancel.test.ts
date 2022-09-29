import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'
import { validateEscrowCancel } from 'xrpl-local/models/transactions/escrowCancel'

/**
 * Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowCancel', () => {
  let cancel

  beforeEach(() => {
    cancel = {
      TransactionType: 'EscrowCancel',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      OfferSequence: 7,
    }
  })

  it(`Valid EscrowCancel`, () => {
    assert.doesNotThrow(() => validateEscrowCancel(cancel))
    assert.doesNotThrow(() => validate(cancel))
  })

  it(`Invalid EscrowCancel missing owner`, () => {
    delete cancel.Owner

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: missing Owner',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: missing Owner',
    )
  })

  it(`Invalid EscrowCancel missing offerSequence`, () => {
    delete cancel.OfferSequence

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: missing OfferSequence',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: missing OfferSequence',
    )
  })

  it(`Invalid OfferSequence`, () => {
    cancel.Owner = 10

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: Owner must be a string',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: Owner must be a string',
    )
  })

  it(`Invalid owner`, () => {
    cancel.OfferSequence = '10'

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: OfferSequence must be a number',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: OfferSequence must be a number',
    )
  })
})
