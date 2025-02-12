import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateEscrowCancel } from '../../src/models/transactions/escrowCancel'

/**
 * Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowCancel', function () {
  let cancel

  beforeEach(function () {
    cancel = {
      TransactionType: 'EscrowCancel',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      OfferSequence: 7,
    }
  })

  it(`Valid EscrowCancel`, function () {
    assert.doesNotThrow(() => validateEscrowCancel(cancel))
    assert.doesNotThrow(() => validate(cancel))
  })

  it(`Valid EscrowCancel with string OfferSequence`, function () {
    cancel.OfferSequence = '7'

    assert.doesNotThrow(() => validateEscrowCancel(cancel))
    assert.doesNotThrow(() => validate(cancel))
  })

  it(`Invalid EscrowCancel missing owner`, function () {
    delete cancel.Owner

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: missing field Owner',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: missing field Owner',
    )
  })

  it(`Invalid EscrowCancel missing offerSequence`, function () {
    delete cancel.OfferSequence

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: missing field OfferSequence',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: missing field OfferSequence',
    )
  })

  it(`Invalid Owner`, function () {
    cancel.Owner = 10

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: invalid field Owner',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: invalid field Owner',
    )
  })

  it(`Invalid OfferSequence`, function () {
    cancel.OfferSequence = 'random'

    assert.throws(
      () => validateEscrowCancel(cancel),
      ValidationError,
      'EscrowCancel: invalid field OfferSequence',
    )
    assert.throws(
      () => validate(cancel),
      ValidationError,
      'EscrowCancel: invalid field OfferSequence',
    )
  })
})
