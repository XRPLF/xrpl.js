import { assert } from 'chai'

import { validate, ValidationError } from '../../src'

const NFTOKEN_BUY_OFFER =
  'AED08CC1F50DD5F23A1948AF86153A3F3B7593E5EC77D65A02BB1B29E05AB6AF'
const NFTOKEN_SELL_OFFER =
  'AED08CC1F50DD5F23A1948AF86153A3F3B7593E5EC77D65A02BB1B29E05AB6AE'

/**
 * NFTokenAcceptOffer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenAcceptOffer', function () {
  it(`verifies valid NFTokenAcceptOffer with NFTokenBuyOffer`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`verifies valid NFTokenAcceptOffer with NFTokenSellOffer`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`throws w/ missing NFTokenSellOffer and NFTokenBuyOffer`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: must set either NFTokenSellOffer or NFTokenBuyOffer',
    )
  })

  it(`throws w/ missing NFTokenSellOffer and present NFTokenBrokerFee`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      NFTokenBrokerFee: '1',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: both NFTokenSellOffer and NFTokenBuyOffer must be set if using brokered mode',
    )
  })

  it(`throws w/ missing NFTokenBuyOffer and present NFTokenBrokerFee`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      NFTokenBrokerFee: '1',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: both NFTokenSellOffer and NFTokenBuyOffer must be set if using brokered mode',
    )
  })

  it(`verifies valid NFTokenAcceptOffer with both offers and no NFTokenBrokerFee`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`verifies valid NFTokenAcceptOffer with NFTokenBrokerFee`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      NFTokenBrokerFee: '1',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`throws w/ NFTokenBrokerFee === 0`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      NFTokenBrokerFee: '0',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: NFTokenBrokerFee must be greater than 0; omit if there is no fee',
    )
  })

  it(`throws w/ NFTokenBrokerFee < 0`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      NFTokenBrokerFee: '-1',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: NFTokenBrokerFee must be greater than 0; omit if there is no fee',
    )
  })

  it(`throws w/ invalid NFTokenBrokerFee`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenSellOffer: NFTOKEN_SELL_OFFER,
      NFTokenBuyOffer: NFTOKEN_BUY_OFFER,
      NFTokenBrokerFee: 1,
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: invalid NFTokenBrokerFee',
    )
  })
})
