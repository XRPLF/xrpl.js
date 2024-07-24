import { assert } from 'chai'

import {
  convertStringToHex,
  validate,
  ValidationError,
  MPTokenIssuanceCreateFlags,
  mptUint64ToHex,
} from '../../src'

/**
 * MPTokenIssuanceCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MPTokenIssuanceCreate', function () {
  it(`verifies valid MPTokenIssuanceCreate`, function () {
    const validMPTokenIssuanceCreate = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: mptUint64ToHex('9223372036854775807'), // 0x7fffffffffffffff
      AssetScale: 2,
      TransferFee: 1,
      Flags: 2,
      MPTokenMetadata: convertStringToHex('http://xrpl.org'),
    } as any

    assert.doesNotThrow(() => validate(validMPTokenIssuanceCreate))
  })

  it(`throws w/ MPTokenMetadata being an empty string`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Flags: MPTokenIssuanceCreateFlags.tfMPTCanLock,
      MPTokenMetadata: '',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: MPTokenMetadata must not be empty string',
    )
  })

  it(`throws w/ MPTokenMetadata not in hex format`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Flags: MPTokenIssuanceCreateFlags.tfMPTCanLock,
      MPTokenMetadata: 'http://xrpl.org',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: MPTokenMetadata must be in hex format',
    )
  })
})
