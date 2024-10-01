import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateBatch } from '../../src/models/transactions/batch'

/**
 * Batch Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Batch', function () {
  let tx

  beforeEach(function () {
    tx = {
      /* TODO: add sample transaction */
    } as any
  })

  it('verifies valid Batch', function () {
    assert.doesNotThrow(() => validateBatch(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  // it('throws w/ invalid BatchSigners', function () {
  //   tx.BatchSigners =
  //     /* TODO */

  //     assert.throws(
  //       () => validateBatch(tx),
  //       ValidationError,
  //       'Batch: invalid field BatchSigners',
  //     )
  //   assert.throws(
  //     () => validate(tx),
  //     ValidationError,
  //     'Batch: invalid field BatchSigners',
  //   )
  // })

  it('throws w/ missing RawTransactions', function () {
    delete tx.RawTransactions

    assert.throws(
      () => validateBatch(tx),
      ValidationError,
      'Batch: missing field RawTransactions',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'Batch: missing field RawTransactions',
    )
  })

  // it('throws w/ invalid RawTransactions', function () {
  //   tx.RawTransactions = assert.throws(
  //     () => validateBatch(tx),
  //     ValidationError,
  //     'Batch: invalid field RawTransactions',
  //   )
  //   assert.throws(
  //     () => validate(tx),
  //     ValidationError,
  //     'Batch: invalid field RawTransactions',
  //   )
  // })

  it('throws w/ missing TxIDs', function () {
    delete tx.TxIDs

    assert.throws(
      () => validateBatch(tx),
      ValidationError,
      'Batch: missing field TxIDs',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'Batch: missing field TxIDs',
    )
  })

  // it('throws w/ invalid TxIDs', function () {
  //   tx.TxIDs = ['hi']

  //   assert.throws(
  //     () => validateBatch(tx),
  //     ValidationError,
  //     'Batch: invalid field TxIDs',
  //   )
  //   assert.throws(
  //     () => validate(tx),
  //     ValidationError,
  //     'Batch: invalid field TxIDs',
  //   )
  // })
})
