import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

const BUY_OFFER =
  'AED08CC1F50DD5F23A1948AF86153A3F3B7593E5EC77D65A02BB1B29E05AB6AF'
const SELL_OFFER =
  'AED08CC1F50DD5F23A1948AF86153A3F3B7593E5EC77D65A02BB1B29E05AB6AE'

/**
 * NFTokenAcceptOffer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenAcceptOffer', function () {
  it(`verifies valid NFTokenAcceptOffer with BuyOffer`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      BuyOffer: BUY_OFFER,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`verifies valid NFTokenAcceptOffer with SellOffer`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      SellOffer: SELL_OFFER,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`throws w/ missing SellOffer and BuyOffer`, function () {
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
      'NFTokenAcceptOffer: must set either SellOffer or BuyOffer',
    )
  })

  it(`throws w/ missing SellOffer and present BrokerFee`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      BuyOffer: BUY_OFFER,
      BrokerFee: '1',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: both SellOffer and BuyOffer must be set if using brokered mode',
    )
  })

  it(`throws w/ missing BuyOffer and present BrokerFee`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      SellOffer: SELL_OFFER,
      BrokerFee: '1',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: both SellOffer and BuyOffer must be set if using brokered mode',
    )
  })

  it(`verifies valid NFTokenAcceptOffer with both offers and no BrokerFee`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      SellOffer: SELL_OFFER,
      BuyOffer: BUY_OFFER,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`verifies valid NFTokenAcceptOffer with BrokerFee`, function () {
    const validNFTokenAcceptOffer = {
      TransactionType: 'NFTokenAcceptOffer',
      SellOffer: SELL_OFFER,
      BuyOffer: BUY_OFFER,
      BrokerFee: '1',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenAcceptOffer))
  })

  it(`throws w/ BrokerFee === 0`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      SellOffer: SELL_OFFER,
      BuyOffer: BUY_OFFER,
      BrokerFee: '0',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: BrokerFee must be greater than 0; omit if there is no fee',
    )
  })

  it(`throws w/ BrokerFee < 0`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      SellOffer: SELL_OFFER,
      BuyOffer: BUY_OFFER,
      BrokerFee: '-1',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: BrokerFee must be greater than 0; omit if there is no fee',
    )
  })

  it(`throws w/ invalid BrokerFee`, function () {
    const invalid = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      SellOffer: SELL_OFFER,
      BuyOffer: BUY_OFFER,
      BrokerFee: 1,
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenAcceptOffer: invalid BrokerFee',
    )
  })
})
