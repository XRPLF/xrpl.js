import { assert } from 'chai'

import { validate, ValidationError } from '../../src'

const TOKEN_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'

/**
 * MPTokenIssuanceDestroy Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MPTokenIssuanceDestroy', function () {
  it(`verifies valid MPTokenIssuanceDestroy`, function () {
    const validMPTokenIssuanceDestroy = {
      TransactionType: 'MPTokenIssuanceDestroy',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenIssuanceDestroy))
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceDestroy',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceDestroy: missing field MPTokenIssuanceID',
    )
  })
})
