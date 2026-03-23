import { MPTokenAuthorizeFlags } from '../../src'
import { validateMPTokenAuthorize } from '../../src/models/transactions/MPTokenAuthorize'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateMPTokenAuthorize)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateMPTokenAuthorize, message)

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

    assertValid(validMPTokenAuthorize)

    validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      MPTokenIssuanceID: TOKEN_ID,
    } as any

    assertValid(validMPTokenAuthorize)

    validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Flags: MPTokenAuthorizeFlags.tfMPTUnauthorize,
    } as any

    assertValid(validMPTokenAuthorize)

    validMPTokenAuthorize = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
      Holder: 'rajgkBmMxmz161r8bWYH7CQAFZP5bA9oSG',
      Flags: MPTokenAuthorizeFlags.tfMPTUnauthorize,
    } as any

    assertValid(validMPTokenAuthorize)
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'MPTokenAuthorize',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assertInvalid(invalid, 'MPTokenAuthorize: missing field MPTokenIssuanceID')
  })
})
