import { stringToHex } from '@xrplf/isomorphic/src/utils'

import { MPTokenIssuanceCreateFlags, MPTokenMetadata } from '../../src'
import {
  MPTokenIssuanceCreateImmutableFlags,
  tifMPTokenIssuanceImmutableMask,
  validateMPTokenIssuanceCreate,
} from '../../src/models/transactions/MPTokenIssuanceCreate'
import {
  MAX_MPT_META_BYTE_LENGTH,
  MPT_META_WARNING_HEADER,
} from '../../src/models/utils/mptokenMetadata'
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
      ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTTransferFee,
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

  it(`verifies valid MPTokenIssuanceCreate w/ tfMPTCanHoldConfidentialBalance`, function () {
    assertValid({
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Flags: MPTokenIssuanceCreateFlags.tfMPTCanHoldConfidentialBalance,
    } as any)

    assertValid({
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Flags: { tfMPTCanHoldConfidentialBalance: true },
    } as any)
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

  it(`throws w/ TransferFee and tfMPTCanHoldConfidentialBalance`, function () {
    // Confidential amounts are encrypted, so a transfer rate cannot apply;
    // rippled rejects this pairing with temBAD_TRANSFER_FEE.
    assertInvalid(
      {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        TransferFee: 100,
        // Distinct flag bits, so addition is equivalent to a bitwise OR.
        Flags:
          MPTokenIssuanceCreateFlags.tfMPTCanTransfer +
          MPTokenIssuanceCreateFlags.tfMPTCanHoldConfidentialBalance,
      } as any,
      'MPTokenIssuanceCreate: TransferFee cannot be provided together with the tfMPTCanHoldConfidentialBalance flag',
    )

    assertInvalid(
      {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        TransferFee: 100,
        Flags: {
          tfMPTCanTransfer: true,
          tfMPTCanHoldConfidentialBalance: true,
        },
      } as any,
      'MPTokenIssuanceCreate: TransferFee cannot be provided together with the tfMPTCanHoldConfidentialBalance flag',
    )
  })

  it(`throws w/ invalid ImmutableFlags value`, async () => {
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ImmutableFlags: tifMPTokenIssuanceImmutableMask,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: Invalid ImmutableFlags value',
    )
  })

  it(`throws w/ ImmutableFlags explicitly set to 0`, async () => {
    // rippled rejects a present-but-zero ImmutableFlags with temINVALID_FLAG.
    const invalid = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ImmutableFlags: 0,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceCreate: Invalid ImmutableFlags value',
    )
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
 * MPTokenSchema (MPTStructuredData) verification testing: the schema must be a
 * well-formed packed-record layout and any MPTokenMetadata must decode exactly
 * against it.
 */
describe('MPTokenIssuanceCreate MPTokenSchema', function () {
  const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
  const create = (
    schema: unknown,
    metadata?: string,
  ): Record<string, unknown> => {
    const tx: Record<string, unknown> = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: ACCOUNT,
      MPTokenSchema: schema,
    }
    if (metadata !== undefined) {
      tx.MPTokenMetadata = metadata
    }
    return tx
  }
  const bytes = (count: number, fill = '00'): string => fill.repeat(count)
  const notWellFormed =
    'MPTokenIssuanceCreate: MPTokenSchema is not a well-formed schema'
  const mismatch =
    'MPTokenIssuanceCreate: MPTokenMetadata does not match MPTokenSchema'

  it('verifies a schema without MPTokenMetadata', function () {
    assertValid(create('0204'))
  })

  it('verifies MPTokenMetadata matching every fixed-width type code', function () {
    // bool, u8, u16, u32, u64, u128, u256, xfl, account, currency, h160, h256, pubkey
    const schema = '0102030405060708090A0B0C0D'
    const widths = [1, 1, 2, 4, 8, 16, 32, 8, 20, 20, 20, 32, 33]
    const data = widths.map((width) => bytes(width, '01')).join('')
    assertValid(create(schema, data))
  })

  it('verifies str and bin values with one- and two-byte length prefixes', function () {
    assertValid(create('0E0F', `03616263${'C100'}${bytes(193, 'AB')}`))
  })

  it('verifies an array of u8 and a nested tuple', function () {
    assertValid(create('2002', '03010203'))
    // tuple(u8, array(tuple(u8, str))): 7, [(5, 'abc'), (6, '')]
    assertValid(create('30022030020E3131', '070205036162630600'))
  })

  it('verifies an empty array', function () {
    assertValid(create('2003', '00'))
  })

  it('verifies a schema of 256 bytes and nesting depth 8', function () {
    assertValid(create(bytes(256, '02')))
    assertValid(create(`${bytes(8, '30')}02${bytes(8, '31')}`))
  })

  it('throws w/ non-string MPTokenSchema', function () {
    assertInvalid(
      create(1),
      'MPTokenIssuanceCreate: invalid field MPTokenSchema',
    )
  })

  it('throws w/ non-hex MPTokenSchema', function () {
    assertInvalid(
      create('zz'),
      'MPTokenIssuanceCreate: MPTokenSchema must be a hex string with an even number of characters',
    )
  })

  it('throws w/ odd-length MPTokenSchema', function () {
    assertInvalid(
      create('020'),
      'MPTokenIssuanceCreate: MPTokenSchema must be a hex string with an even number of characters',
    )
  })

  it('throws w/ empty MPTokenSchema', function () {
    assertInvalid(
      create(''),
      'MPTokenIssuanceCreate: MPTokenSchema must be between 1 and 256 bytes',
    )
  })

  it('throws w/ MPTokenSchema longer than 256 bytes', function () {
    assertInvalid(
      create(bytes(257, '02')),
      'MPTokenIssuanceCreate: MPTokenSchema must be between 1 and 256 bytes',
    )
  })

  it('throws w/ a reserved type code', function () {
    assertInvalid(create('10'), notWellFormed)
    assertInvalid(create('00'), notWellFormed)
  })

  it('throws w/ a tupleClose without a tupleOpen', function () {
    assertInvalid(create('31'), notWellFormed)
  })

  it('throws w/ an unterminated tuple', function () {
    assertInvalid(create('3002'), notWellFormed)
  })

  it('throws w/ an array code without an element type', function () {
    assertInvalid(create('20'), notWellFormed)
  })

  it('throws w/ an array of a zero-width element', function () {
    assertInvalid(create('203031'), notWellFormed)
    assertInvalid(create('2030303131'), notWellFormed)
  })

  it('throws w/ nesting deeper than 8', function () {
    assertInvalid(create(`${bytes(9, '30')}02${bytes(9, '31')}`), notWellFormed)
    assertInvalid(create(`${bytes(9, '20')}02`), notWellFormed)
  })

  describe('MPTokenMetadata decoding against MPTokenSchema', function () {
    it('throws w/ MPTokenMetadata shorter than the schema', function () {
      assertInvalid(create('04', '010203'), mismatch)
    })

    it('throws w/ trailing MPTokenMetadata bytes', function () {
      assertInvalid(create('02', '0102'), mismatch)
    })

    it('throws w/ a bool value other than 0 or 1', function () {
      assertValid(create('01', '01'))
      assertInvalid(create('01', '02'), mismatch)
    })

    it('throws w/ a truncated str value', function () {
      assertInvalid(create('0E', '036162'), mismatch)
    })

    it('throws w/ a truncated two-byte length prefix', function () {
      assertInvalid(create('0F', 'C1'), mismatch)
    })

    it('throws w/ an invalid length prefix byte', function () {
      assertInvalid(create('0F', 'FF'), mismatch)
    })

    it('throws w/ an array count larger than the data', function () {
      assertInvalid(create('2002', '030102'), mismatch)
    })
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
      uris: ['apple'],
    } as unknown as MPTokenMetadata
    const tx = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenMetadata: stringToHex(JSON.stringify(mptMetaData)),
    }

    assertValid(tx)

    const expectedMessage = [
      MPT_META_WARNING_HEADER,
      '- uris/us: should be an array of objects each with uri/u, category/c, and title/t properties.',
    ].join('\n')

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(expectedMessage),
    )
  })

  it(`does not log an XLS-89 warning when MPTokenSchema types the metadata`, function () {
    const tx = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenSchema: '0E',
      MPTokenMetadata: '03616263',
    }

    assertValid(tx)

    expect(console.warn).not.toHaveBeenCalled()
  })
})
/* eslint-enable no-console  */
