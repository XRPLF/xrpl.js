import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { MPTokenIssuanceSetFlags } from '../../src'
import { MAX_MPT_META_BYTE_LENGTH } from '../../src/models/transactions/common'
import { MAX_TRANSFER_FEE } from '../../src/models/transactions/MPTokenIssuanceCreate'
import { validateMPTokenIssuanceSet } from '../../src/models/transactions/MPTokenIssuanceSet'
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
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      Flags: MPTokenIssuanceSetFlags.tfMPTLock,
    } as any

    assertValid(validMPTokenIssuanceSet)

    // It's fine to not specify any flag, it means only tx fee is deducted
    validMPTokenIssuanceSet = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
    } as any

    assertValid(validMPTokenIssuanceSet)

    assertValid({
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MutableFlags: MPTokenIssuanceSetFlags.tfMPTClearCanTransfer,
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

    assertInvalid(invalid, `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`)
  })

  it(`Throws w/ invalid (too high) value of TransferFee`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      TransferFee: MAX_TRANSFER_FEE + 1,
    } as any

    assertInvalid(invalid, `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`)
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

    assertInvalid(invalid, `MPTokenIssuanceSet: MPTokenMetadata (hex format) must be non-empty and no more than ${MAX_MPT_META_BYTE_LENGTH} bytes.`,)
  })

  it(`Throws w/ invalid (too large) MPTokenMetadata`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceSet',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      MPTokenMetadata: stringToHex('a'.repeat(MAX_MPT_META_BYTE_LENGTH + 1)),
    } as any

    assertInvalid(invalid, `MPTokenIssuanceSet: MPTokenMetadata (hex format) must be non-empty and no more than ${MAX_MPT_META_BYTE_LENGTH} bytes.`,)
  })
})
