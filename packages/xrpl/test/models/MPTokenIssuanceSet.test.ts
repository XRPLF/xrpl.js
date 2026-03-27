import { MPTokenIssuanceSetFlags } from '../../src'
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
})
