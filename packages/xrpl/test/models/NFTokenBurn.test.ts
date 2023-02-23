import { assert } from 'chai'

import { validate, ValidationError } from '../../src'

const TOKEN_ID =
  '00090032B5F762798A53D543A014CAF8B297CFF8F2F937E844B17C9E00000003'

/**
 * NFTokenBurn Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenBurn', function () {
  it(`verifies valid NFTokenBurn`, function () {
    const validNFTokenBurn = {
      TransactionType: 'NFTokenBurn',
      NFTokenID: TOKEN_ID,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenBurn))
  })

  it(`throws w/ missing NFTokenID`, function () {
    const invalid = {
      TransactionType: 'NFTokenBurn',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenBurn: missing field NFTokenID',
    )
  })
})
