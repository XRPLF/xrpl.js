import { stringToHex } from '@xrplf/isomorphic/src/utils'

import { MPTokenIssuanceCreateFlags, MPTokenMetadata } from '../../src'
// import { MPTokenIssuanceCreateMutableFlags } from '../../src/models/transactions/MPTokenIssuanceCreate'
import {
  MAX_MPT_META_BYTE_LENGTH,
  MPT_META_WARNING_HEADER,
} from '../../src/models/transactions/common'
import {
  MPTokenIssuanceCreateMutableFlags,
  tmfMPTokenIssuanceCreateMutableMask,
  validateMPTokenIssuanceCreate,
} from '../../src/models/transactions/MPTokenIssuanceCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateMPTokenIssuanceCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateMPTokenIssuanceCreate, message)

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
      MutableFlags:
        MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateTransferFee,
      MPTokenMetadata: stringToHex(`{
        "ticker": "TBILL",
        "name": "T-Bill Yield Token",
        "icon": "https://example.org/tbill-icon.png",
        "asset_class": "rwa",
        "asset_subclass": "treasury",
        "issuer_name": "Example Yield Co."
      }`),
    } as any

    assertValid(validMPTokenIssuanceCreate)
  })

  it(`throws w/ MPTokenMetadata being an empty string`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Flags: MPTokenIssuanceCreateFlags.tfMPTCanLock,
      MPTokenMetadata: '',
    } as any

    assertInvalid(
      invalid,
      `MPTokenIssuanceCreate: MPTokenMetadata (hex format) must be non-empty and no more than ${MAX_MPT_META_BYTE_LENGTH} bytes.`,
    )
  })

  it(`throws w/ MPTokenMetadata not in hex format`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Flags: MPTokenIssuanceCreateFlags.tfMPTCanLock,
      MPTokenMetadata: 'http://xrpl.org',
    } as any

    assertInvalid(
      invalid,
      `MPTokenIssuanceCreate: MPTokenMetadata (hex format) must be non-empty and no more than ${MAX_MPT_META_BYTE_LENGTH} bytes.`,
    )
  })

  it(`throws w/ Invalid MaximumAmount`, function () {
    let invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '9223372036854775808',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: MaximumAmount out of range')

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '-1',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: Invalid MaximumAmount')

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '0x12',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: Invalid MaximumAmount')
  })

  it(`throws w/ Invalid TransferFee`, function () {
    let invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: -1,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: TransferFee must be between 0 and 50000',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 50001,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: TransferFee must be between 0 and 50000',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 100,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: TransferFee cannot be provided without enabling tfMPTCanTransfer flag',
    )

    invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 100,
      Flags: { tfMPTCanClawback: true },
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: TransferFee cannot be provided without enabling tfMPTCanTransfer flag',
    )
  })

  it(`throws w/ invalid MutableFlags value`, async () => {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MutableFlags: tmfMPTokenIssuanceCreateMutableMask,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: Invalid MutableFlags value')
  })

  it(`throws with Zero MaximumAmount`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MaximumAmount: '0',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: MaximumAmount out of range')
  })

  it(`throws with Zero DomainID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      DomainID: '0'.repeat(64),
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: invalid field DomainID')
  })

  it(`throws with DomainID and tfMPTRequireAuth flag not set`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      DomainID: '1'.repeat(64),
      Flags: 0,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: Cannot set DomainID unless tfMPTRequireAuth flag is set.',
    )
  })

  it(`throws with invalid type of DomainID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      DomainID: 1,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceCreate: invalid field DomainID')
  })
})

/**
 * Test console warning is logged while validating MPTokenIssuanceCreate for MPTokenMetadata field.
 */
/* eslint-disable no-console -- Require to test console warnings  */
describe('MPTokenMetadata warnings', function () {
  beforeEach(() => {
    jest.spyOn(console, 'warn')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it(`logs console warning`, function () {
    const mptMetaData: MPTokenMetadata = {
      ticker: 'TBILL',
      name: 'T-Bill Token',
      icon: 'http://example.com/icon.png',
      asset_class: 'rwa',
      asset_subclass: 'treasury',
      issuer_name: 'Issuer',
    }
    const tx = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenMetadata: stringToHex(JSON.stringify(mptMetaData)),
    }

    assertValid(tx)

    const expectedMessage = [
      MPT_META_WARNING_HEADER,
      '- icon should be a valid https url.',
    ].join('\n')

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(expectedMessage),
    )
  })
})
/* eslint-enable no-console  */
