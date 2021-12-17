import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

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
      TokenOffers: [BUY_OFFER],
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenCancelOffer))
  })

  it(`throws w/ missing TokenOffers`, function () {
    const invalid = {
      TransactionType: 'NFTokenCancelOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCancelOffer: missing field TokenOffers',
    )
  })

  it(`throws w/ empty TokenOffers`, function () {
    const invalid = {
      TransactionType: 'NFTokenCancelOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TokenOffers: [],
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCancelOffer: empty field TokenOffers',
    )
  })
})
