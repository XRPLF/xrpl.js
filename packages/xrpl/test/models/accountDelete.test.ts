import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateAccountDelete } from '../../src/models/transactions/accountDelete'

/**
 * AccountDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AccountDelete', function () {
  let validAccountDelete

  beforeEach(() => {
    validAccountDelete = {
      TransactionType: 'AccountDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      DestinationTag: 13,
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
      CredentialIDs: [
        'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A',
      ],
    } as any
  })
  it(`verifies valid AccountDelete`, function () {
    assert.doesNotThrow(() => validateAccountDelete(validAccountDelete))
  })

  it(`throws w/ missing Destination`, function () {
    validAccountDelete.Destination = undefined
    const errorMessage = 'AccountDelete: missing field Destination'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )

    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ invalid Destination`, function () {
    validAccountDelete.Destination = 65478965
    const errorMessage = 'AccountDelete: invalid field Destination'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ invalid DestinationTag`, function () {
    validAccountDelete.DestinationTag = 'gvftyujnbv'
    const errorMessage = 'AccountDelete: invalid field DestinationTag'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )

    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ non-array CredentialIDs`, function () {
    validAccountDelete.CredentialIDs =
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

    const errorMessage = 'AccountDelete: Credentials must be an array'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws CredentialIDs length exceeds max length`, function () {
    validAccountDelete.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66B',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66C',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66D',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66E',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66F',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F660',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F661',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'AccountDelete: Credentials length cannot exceed 8 elements'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ empty CredentialIDs`, function () {
    validAccountDelete.CredentialIDs = []

    const errorMessage = 'AccountDelete: Credentials cannot be an empty array'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ non-string CredentialIDs`, function () {
    validAccountDelete.CredentialIDs = [
      123123,
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage = 'AccountDelete: Invalid Credentials ID list format'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ duplicate CredentialIDs`, function () {
    validAccountDelete.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'AccountDelete: Credentials cannot contain duplicate elements'

    assert.throws(
      () => validateAccountDelete(validAccountDelete),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(validAccountDelete),
      ValidationError,
      errorMessage,
    )
  })
})
