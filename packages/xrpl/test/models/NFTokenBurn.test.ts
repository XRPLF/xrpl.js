import { validateNFTokenBurn } from '../../src/models/transactions/NFTokenBurn'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateNFTokenBurn)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateNFTokenBurn, message)

const TOKEN_ID =
  '00090032B5F762798A53D543A014CAF8B297CFF8F2F937E844B17C9E00000003'

/**
 * NFTokenBurn Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenBurn', function () {
  it(`verifies valid NFTokenBurn`, function () {
    const validNFTokenBurn = {
      TransactionType: 'NFTokenBurn',
      NFTokenID: TOKEN_ID,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assertValid(validNFTokenBurn)
  })

  it(`throws w/ missing NFTokenID`, function () {
    const invalid = {
      TransactionType: 'NFTokenBurn',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assertInvalid(invalid, 'NFTokenBurn: missing field NFTokenID')
  })
})
