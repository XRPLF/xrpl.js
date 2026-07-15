import { stringToHex } from '@xrplf/isomorphic/utils'

import { MPTokenIssuanceSetFlags } from '../../src'
import { MAX_TRANSFER_FEE } from '../../src/models/transactions/MPTokenIssuanceCreate'
import {
  validateMPTokenIssuanceSet,
  tmfMPTokenIssuanceSetMutableMask,
  MPTokenIssuanceSetMutableFlags,
} from '../../src/models/transactions/MPTokenIssuanceSet'
import { MAX_MPT_META_BYTE_LENGTH } from '../../src/models/utils/mptokenMetadata'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateMPTokenIssuanceSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateMPTokenIssuanceSet, message)

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

    assertValid(validMPTokenIssuanceSet)

    validMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: MPTokenIssuanceSetFlags.tfMPTLock,
    } as any

    assertValid(validMPTokenIssuanceSet)

    // A single MutableFlags "enable" bit is valid.
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTransfer,
    } as any)
  })

  it(`verifies valid MPTokenIssuanceSet with multiple MutableFlags`, function () {
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags:
        // eslint-disable-next-line no-bitwise -- required to OR the flags
        MPTokenIssuanceSetMutableFlags.tmfMPTSetCanLock |
        MPTokenIssuanceSetMutableFlags.tmfMPTSetRequireAuth |
        MPTokenIssuanceSetMutableFlags.tmfMPTSetCanEscrow |
        MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTrade |
        MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTransfer |
        MPTokenIssuanceSetMutableFlags.tmfMPTSetCanClawback,
    } as any)
  })

  it(`verifies valid MPTokenIssuanceSet mutating TransferFee and MPTokenMetadata`, function () {
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      TransferFee: 100,
      MPTokenMetadata: stringToHex('updated metadata'),
    } as any)
  })

  it(`accepts an empty MPTokenMetadata (clears the field per rippled)`, function () {
    // rippled MPTokenIssuanceSet doApply treats an empty blob as a clear
    // (makeFieldAbsent), so an empty string must pass client validation.
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MPTokenMetadata: '',
    } as any)
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ conflicting flags`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
    } as any

    invalid.Flags =
      // eslint-disable-next-line no-bitwise -- not needed
      MPTokenIssuanceSetFlags.tfMPTLock | MPTokenIssuanceSetFlags.tfMPTUnlock

    assertInvalid(invalid, 'MPTokenIssuanceSet: flag conflict')

    invalid.Flags = { tfMPTLock: true, tfMPTUnlock: true }

    assertInvalid(invalid, 'MPTokenIssuanceSet: flag conflict')
  })

  it(`Throws w/ invalid type of TransferFee`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      TransferFee: '100',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: invalid field TransferFee')
  })

  it(`Throws w/ invalid (too low) value of TransferFee`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      TransferFee: -1,
    } as any

    assertInvalid(
      invalid,
      `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`,
    )
  })

  it(`Throws w/ invalid (too high) value of TransferFee`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      TransferFee: MAX_TRANSFER_FEE + 1,
    } as any

    assertInvalid(
      invalid,
      `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`,
    )
  })

  it(`Throws w/ invalid type of MutableFlags`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: '100',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: invalid field MutableFlags')
  })

  it(`Throws w/ invalid MutableFlags value`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: tmfMPTokenIssuanceSetMutableMask,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: Invalid MutableFlags value')
  })

  it(`Throws w/ a MutableFlags bit outside the DynamicMPT range`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      // 0x40 is above the highest DynamicMPT "set" flag (tmfMPTSetCanClawback = 0x20)
      MutableFlags: 0x00000040,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: Invalid MutableFlags value')
  })

  it(`Throws w/ MutableFlags explicitly set to 0`, function () {
    // rippled rejects a present-but-zero MutableFlags with temINVALID_FLAG.
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: 0,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: Invalid MutableFlags value')
  })

  it(`Throws w/ invalid type of MPTokenMetadata`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MPTokenMetadata: 1234,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: invalid field MPTokenMetadata')
  })

  it(`Throws w/ invalid (non-hex characters) MPTokenMetadata`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MPTokenMetadata: 'zznothex',
    } as any

    assertInvalid(
      invalid,
      `MPTokenIssuanceSet: MPTokenMetadata must be a valid hex string no more than ${MAX_MPT_META_BYTE_LENGTH} bytes (an empty string clears the field).`,
    )
  })

  it(`Throws w/ invalid (too large) MPTokenMetadata`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MPTokenMetadata: stringToHex('a'.repeat(MAX_MPT_META_BYTE_LENGTH + 1)),
    } as any

    assertInvalid(
      invalid,
      `MPTokenIssuanceSet: MPTokenMetadata must be a valid hex string no more than ${MAX_MPT_META_BYTE_LENGTH} bytes (an empty string clears the field).`,
    )
  })

  it(`Throws w/ invalid type of DomainID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      DomainID: 1,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: invalid field DomainID')
  })

  it(`Throws w/ both DomainID and Holder fields`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      DomainID:
        'DDC2BBBDC8E8F03A78AEFC68C28EC9AF40CB3499310B9F5E0CC0C0FEDFEE2D6F',
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: Cannot set both DomainID and Holder fields.',
    )
  })

  it(`throws w/ identical holder and account ID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: Holder cannot be the same as the Account.',
    )
  })

  it(`Throws w/ no changes to the MPTokenIssuance ledger object`, function () {
    const noOpMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
    } as any

    assertInvalid(
      noOpMPTokenIssuanceSet,
      'MPTokenIssuanceSet: Transaction does not change the state of the MPTokenIssuance ledger object.',
    )
  })

  it(`Throws w/ object-form Flags that resolve to 0 (empty object)`, function () {
    const noOpMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: {},
    } as any

    assertInvalid(
      noOpMPTokenIssuanceSet,
      'MPTokenIssuanceSet: Transaction does not change the state of the MPTokenIssuance ledger object.',
    )
  })

  it(`Throws w/ object-form Flags that resolve to 0 (all flags false)`, function () {
    const noOpMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: { tfMPTLock: false, tfMPTUnlock: false },
    } as any

    assertInvalid(
      noOpMPTokenIssuanceSet,
      'MPTokenIssuanceSet: Transaction does not change the state of the MPTokenIssuance ledger object.',
    )
  })

  it(`Throws w/ Holder field and mutating the MPTokenIssuance ledger object`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTransfer,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: Holder field is not allowed when mutating MPTokenIssuance.',
    )
  })

  it(`Throws w/ Flags field and mutating the MPTokenIssuance ledger object`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTransfer,
      Flags: MPTokenIssuanceSetFlags.tfMPTLock,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: Can not set flags when mutating MPTokenIssuance.',
    )
  })
})
