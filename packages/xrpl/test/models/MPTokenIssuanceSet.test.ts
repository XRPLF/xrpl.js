import { assert } from 'chai'

import { validate, ValidationError, MPTokenIssuanceSetFlags } from '../../src'

const TOKEN_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'

/**
 * MPTokenIssuanceSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MPTokenIssuanceSet', function () {
  it(`verifies valid MPTokenIssuanceSet`, function () {
    let validMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: MPTokenIssuanceSetFlags.tfMPTLock,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenIssuanceSet))
    validMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      Flags: MPTokenIssuanceSetFlags.tfMPTLock,
    } as any

    assert.doesNotThrow(() => validate(validMPTokenIssuanceSet))

    // It's fine to not specify any flag, it means only tx fee is deducted
    validMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
    } as any

    assert.doesNotThrow(() => validate(validMPTokenIssuanceSet))
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceSet: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ conflicting flags`, function () {
    /* eslint-disable no-bitwise -- Bitwise operation needed for flag combination */
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags:
        MPTokenIssuanceSetFlags.tfMPTLock | MPTokenIssuanceSetFlags.tfMPTUnlock,
    } as any
    /* eslint-enable no-bitwise -- Re-enable bitwise rule */

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceSet: flag conflict',
    )
  })
})
