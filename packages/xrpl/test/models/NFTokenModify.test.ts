import { assert } from 'chai'

import { convertStringToHex, validate, ValidationError } from '../../src'

const TOKEN_ID =
  '00090032B5F762798A53D543A014CAF8B297CFF8F2F937E844B17C9E00000003'

/**
 * NFTokenModify Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenModify', function () {
  it(`verifies valid NFTokenModify`, function () {
    const validNFTokenModify = {
      TransactionType: 'NFTokenModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenID: TOKEN_ID,
      Fee: '5000000',
      Sequence: 2470665,
      URI: convertStringToHex('http://xrpl.org'),
    } as any

    assert.doesNotThrow(() => validate(validNFTokenModify))
  })

  it(`throws w/ missing NFTokenID`, function () {
    const invalid = {
      TransactionType: 'NFTokenModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenModify: missing field NFTokenID',
    )
  })
})
