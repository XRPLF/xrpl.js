import { assert } from 'chai'

import { validate, ValidationError } from 'xrpl-local'
import { validateAccountDelete } from 'xrpl-local/models/transactions/accountDelete'

/**
 * AccountDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AccountDelete', function () {
  it(`verifies valid AccountDelete`, function () {
    const validAccountDelete = {
      TransactionType: 'AccountDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      DestinationTag: 13,
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validateAccountDelete(validAccountDelete))
  })

  it(`throws w/ missing Destination`, function () {
    const invalidDestination = {
      TransactionType: 'AccountDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validateAccountDelete(invalidDestination),
      ValidationError,
      'AccountDelete: missing field Destination',
    )

    assert.throws(
      () => validate(invalidDestination),
      ValidationError,
      'AccountDelete: missing field Destination',
    )
  })

  it(`throws w/ invalid Destination`, function () {
    const invalidDestination = {
      TransactionType: 'AccountDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 65478965,
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validateAccountDelete(invalidDestination),
      ValidationError,
      'AccountDelete: invalid Destination',
    )
    assert.throws(
      () => validate(invalidDestination),
      ValidationError,
      'AccountDelete: invalid Destination',
    )
  })

  it(`throws w/ invalid DestinationTag`, function () {
    const invalidDestinationTag = {
      TransactionType: 'AccountDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      DestinationTag: 'gvftyujnbv',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validateAccountDelete(invalidDestinationTag),
      ValidationError,
      'AccountDelete: invalid DestinationTag',
    )

    assert.throws(
      () => validate(invalidDestinationTag),
      ValidationError,
      'AccountDelete: invalid DestinationTag',
    )
  })
})
