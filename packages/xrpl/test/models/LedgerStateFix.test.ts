import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateLedgerStateFix } from '../../src/models/transactions/ledgerStateFix'

/**
 * LedgerStateFix Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('LedgerStateFix', function () {
  let tx

  beforeEach(function () {
    tx = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'LedgerStateFix',
      LedgerFixType: 1,
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    } as any
  })

  it('verifies valid LedgerStateFix', function () {
    assert.doesNotThrow(() => validateLedgerStateFix(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing LedgerFixType', function () {
    delete tx.LedgerFixType

    assert.throws(
      () => validateLedgerStateFix(tx),
      ValidationError,
      'LedgerStateFix: missing field LedgerFixType',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'LedgerStateFix: missing field LedgerFixType',
    )
  })

  it('throws w/ invalid LedgerFixType', function () {
    tx.LedgerFixType = 'number'

    assert.throws(
      () => validateLedgerStateFix(tx),
      ValidationError,
      'LedgerStateFix: invalid field LedgerFixType',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'LedgerStateFix: invalid field LedgerFixType',
    )
  })

  it('throws w/ invalid Owner', function () {
    tx.Owner = 123

    assert.throws(
      () => validateLedgerStateFix(tx),
      ValidationError,
      'LedgerStateFix: invalid field Owner',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'LedgerStateFix: invalid field Owner',
    )
  })
})
