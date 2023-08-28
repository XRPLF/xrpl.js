import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateAMMDelete } from '../../src/models/transactions/AMMDelete'

/**
 * AMMDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMDelete', function () {
  let ammDelete

  beforeEach(function () {
    ammDelete = {
      TransactionType: 'AMMDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      },
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid AMMDelete`, function () {
    assert.doesNotThrow(() => validateAMMDelete(ammDelete))
    assert.doesNotThrow(() => validate(ammDelete))
  })

  it(`throws w/ missing field Asset`, function () {
    delete ammDelete.Asset
    const errorMessage = 'AMMDelete: missing field Asset'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })

  it(`throws w/ Asset must be a Currency`, function () {
    ammDelete.Asset = 1234
    const errorMessage = 'AMMDelete: Asset must be a Currency'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })

  it(`throws w/ missing field Asset2`, function () {
    delete ammDelete.Asset2
    const errorMessage = 'AMMDelete: missing field Asset2'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })

  it(`throws w/ Asset2 must be a Currency`, function () {
    ammDelete.Asset2 = 1234
    const errorMessage = 'AMMDelete: Asset2 must be a Currency'
    assert.throws(
      () => validateAMMDelete(ammDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammDelete), ValidationError, errorMessage)
  })
})
