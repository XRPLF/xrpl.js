import { stringToHex } from '@xrplf/isomorphic/utils'

import { MPTokenIssuanceSetFlags } from '../../src'
import {
  MAX_TRANSFER_FEE,
  MPTokenIssuanceCreateImmutableFlags,
  tifMPTokenIssuanceImmutableMask,
} from '../../src/models/transactions/MPTokenIssuanceCreate'
import { validateMPTokenIssuanceSet } from '../../src/models/transactions/MPTokenIssuanceSet'
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

    // A single capability-setting flag is valid.
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: MPTokenIssuanceSetFlags.tfMPTSetCanTransfer,
    } as any)
  })

  it(`verifies valid MPTokenIssuanceSet with multiple capability-setting flags`, function () {
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags:
        // eslint-disable-next-line no-bitwise -- required to OR the flags
        MPTokenIssuanceSetFlags.tfMPTSetCanLock |
        MPTokenIssuanceSetFlags.tfMPTSetRequireAuth |
        MPTokenIssuanceSetFlags.tfMPTSetCanEscrow |
        MPTokenIssuanceSetFlags.tfMPTSetCanTrade |
        MPTokenIssuanceSetFlags.tfMPTSetCanTransfer |
        MPTokenIssuanceSetFlags.tfMPTSetCanClawback,
    } as any)

    // object-form flags are equivalent.
    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: { tfMPTSetCanEscrow: true, tfMPTSetCanTrade: true },
    } as any)
  })

  // Grouped in a nested describe to keep valid-mutation coverage together
  // (and to keep the parent describe under the max-statements limit).
  describe('valid mutations (XLS-94D)', function () {
    it(`mutates TransferFee and MPTokenMetadata`, function () {
      assertValid({
        TransactionType: 'MPTokenIssuanceSet',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        MPTokenIssuanceID: TOKEN_ID,
        TransferFee: 100,
        MPTokenMetadata: stringToHex('updated metadata'),
      } as any)
    })

    it(`enables tfMPTSetCanTransfer and sets a TransferFee atomically`, function () {
      // XLS-94D allows enabling lsfMPTCanTransfer and setting a non-zero
      // TransferFee in the same transaction.
      assertValid({
        TransactionType: 'MPTokenIssuanceSet',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        MPTokenIssuanceID: TOKEN_ID,
        Flags: MPTokenIssuanceSetFlags.tfMPTSetCanTransfer,
        TransferFee: 200,
      } as any)
    })

    it(`accepts ImmutableFlags on its own`, function () {
      assertValid({
        TransactionType: 'MPTokenIssuanceSet',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        MPTokenIssuanceID: TOKEN_ID,
        ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTMetadata,
      } as any)
    })
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

  it(`verifies valid MPTokenIssuanceSet w/ confidential encryption keys`, function () {
    // 33-byte compressed EC point.
    const EC_POINT = `02${'AB'.repeat(32)}`

    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      IssuerEncryptionKey: EC_POINT,
      AuditorEncryptionKey: EC_POINT,
    } as any)
  })

  it(`throws w/ AuditorEncryptionKey but no IssuerEncryptionKey`, function () {
    assertInvalid(
      {
        TransactionType: 'MPTokenIssuanceSet',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        MPTokenIssuanceID: TOKEN_ID,
        AuditorEncryptionKey: `02${'AB'.repeat(32)}`,
      } as any,
      'MPTokenIssuanceSet: AuditorEncryptionKey requires IssuerEncryptionKey',
    )
  })

  it(`throws w/ wrong-length IssuerEncryptionKey`, function () {
    assertInvalid(
      {
        TransactionType: 'MPTokenIssuanceSet',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        MPTokenIssuanceID: TOKEN_ID,
        // 32-byte value where a 33-byte EC point is required.
        IssuerEncryptionKey: 'AB'.repeat(32),
      } as any,
      'MPTokenIssuanceSet: invalid field IssuerEncryptionKey',
    )
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

  it(`Throws w/ invalid type of ImmutableFlags`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      ImmutableFlags: '100',
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: invalid field ImmutableFlags')
  })

  it(`Throws w/ invalid ImmutableFlags value`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      ImmutableFlags: tifMPTokenIssuanceImmutableMask,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: Invalid ImmutableFlags value')
  })

  it(`Throws w/ an ImmutableFlags bit outside the DynamicMPT range`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      // 0x1 (reserved) is not a valid ImmutableFlags bit.
      ImmutableFlags: 0x00000001,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: Invalid ImmutableFlags value')
  })

  it(`Throws w/ ImmutableFlags explicitly set to 0`, function () {
    // rippled rejects a present-but-zero ImmutableFlags with temINVALID_FLAG.
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      ImmutableFlags: 0,
    } as any

    assertInvalid(invalid, 'MPTokenIssuanceSet: Invalid ImmutableFlags value')
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
      Flags: MPTokenIssuanceSetFlags.tfMPTSetCanTransfer,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: Holder field is not allowed when mutating MPTokenIssuance.',
    )
  })

  it(`Throws w/ lock/unlock combined with mutating the MPTokenIssuance ledger object`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags:
        // eslint-disable-next-line no-bitwise -- required to OR the flags
        MPTokenIssuanceSetFlags.tfMPTLock |
        MPTokenIssuanceSetFlags.tfMPTSetCanTransfer,
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceSet: Can not lock/unlock while mutating MPTokenIssuance.',
    )

    // lock combined with a field mutation is also rejected.
    assertInvalid(
      {
        TransactionType: 'MPTokenIssuanceSet',
        Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        MPTokenIssuanceID: TOKEN_ID,
        Flags: MPTokenIssuanceSetFlags.tfMPTUnlock,
        MPTokenMetadata: stringToHex('updated metadata'),
      } as any,
      'MPTokenIssuanceSet: Can not lock/unlock while mutating MPTokenIssuance.',
    )
  })
})
