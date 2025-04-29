import { validateNFTokenCancelOffer } from '../../src/models/transactions/NFTokenCancelOffer'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateNFTokenCancelOffer)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateNFTokenCancelOffer, message)

const BUY_OFFER =
  'AED08CC1F50DD5F23A1948AF86153A3F3B7593E5EC77D65A02BB1B29E05AB6AF'

/**
 * NFTokenCancelOffer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenCancelOffer', function () {
  it(`verifies valid NFTokenCancelOffer`, function () {
    const validNFTokenCancelOffer = {
      TransactionType: 'NFTokenCancelOffer',
      NFTokenOffers: [BUY_OFFER],
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assertValid(validNFTokenCancelOffer)
  })

  it(`throws w/ missing NFTokenOffers`, function () {
    const invalid = {
      TransactionType: 'NFTokenCancelOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assertInvalid(invalid, 'NFTokenCancelOffer: missing field NFTokenOffers')
  })

  it(`throws w/ empty NFTokenOffers`, function () {
    const invalid = {
      TransactionType: 'NFTokenCancelOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenOffers: [],
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assertInvalid(invalid, 'NFTokenCancelOffer: empty field NFTokenOffers')
  })
})
