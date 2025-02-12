import { validateMPTokenIssuanceDestroy } from '../../src/models/transactions/MPTokenIssuanceDestroy'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateMPTokenIssuanceDestroy)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateMPTokenIssuanceDestroy, message)

const TOKEN_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'

/**
 * MPTokenIssuanceDestroy Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MPTokenIssuanceDestroy', function () {
  it(`verifies valid MPTokenIssuanceDestroy`, function () {
    const validMPTokenIssuanceDestroy = {
      TransactionType: 'MPTokenIssuanceDestroy',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: TOKEN_ID,
    } as any

    assertValid(validMPTokenIssuanceDestroy)
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'MPTokenIssuanceDestroy',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assertInvalid(
      invalid,
      'MPTokenIssuanceDestroy: missing field MPTokenIssuanceID',
    )
  })
})
