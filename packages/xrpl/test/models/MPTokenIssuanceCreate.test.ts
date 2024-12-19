import { assert } from 'chai'

import {
  convertStringToHex,
  validate,
  ValidationError,
  MPTokenIssuanceCreateFlags,
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
      // 0x7fffffffffffffff
      MaximumAmount: '9223372036854775807',
      AssetScale: 2,
      TransferFee: 1,
      Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
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

  it(`throws w/ Invalid MaximumAmount`, function () {
    let invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '9223372036854775808',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: MaximumAmount out of range',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '-1',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: Invalid MaximumAmount',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '0x12',
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: Invalid MaximumAmount',
    )
  })

  it(`throws w/ Invalid TransferFee`, function () {
    let invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: -1,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: TransferFee must be between 0 and 50000',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 50001,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: TransferFee must be between 0 and 50000',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 100,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: TransferFee cannot be provided without enabling tfMPTCanTransfer flag',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 100,
      Flags: { tfMPTCanClawback: true },
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'MPTokenIssuanceCreate: TransferFee cannot be provided without enabling tfMPTCanTransfer flag',
    )
  })
})
