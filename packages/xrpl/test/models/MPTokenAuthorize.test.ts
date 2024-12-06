import { assert } from 'chai'

import { validate, ValidationError, MPTokenAuthorizeFlags } from '../../src'

const TOKEN_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'

/**
 * MPTokenAuthorize Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MPTokenAuthorize', function () {
  it(`verifies valid MPTokenAuthorize`, function () {
    let validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenAuthorize))

    validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      MPTokenIssuanceID: TOKEN_ID,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenAuthorize))

    validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: MPTokenAuthorizeFlags.tfMPTUnauthorize,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenAuthorize))

    validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      Flags: MPTokenAuthorizeFlags.tfMPTUnauthorize,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenAuthorize))
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenAuthorize: missing field MPTokenIssuanceID',
    )
  })
})
