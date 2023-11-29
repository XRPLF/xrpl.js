import { assert } from 'chai'

import { validate, ValidationError, NFTokenCreateOfferFlags } from '../../src'

const NFTOKEN_ID =
  '00090032B5F762798A53D543A014CAF8B297CFF8F2F937E844B17C9E00000003'

/**
 * NFTokenCreateOffer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenCreateOffer', function () {
  it(`verifies valid NFTokenCreateOffer buyside`, function () {
    const validNFTokenCreateOffer = {
      TransactionType: 'NFTokenCreateOffer',
      NFTokenID: NFTOKEN_ID,
      Amount: '1',
      Owner: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      Expiration: 1000,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenCreateOffer))
  })

  it(`verifies valid NFTokenCreateOffer sellside`, function () {
    const validNFTokenCreateOffer = {
      TransactionType: 'NFTokenCreateOffer',
      NFTokenID: NFTOKEN_ID,
      Amount: '1',
      Flags: {
        tfSellNFToken: true,
      },
      Expiration: 1000,
      Destination: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenCreateOffer))
  })

  it(`verifies w/ 0 Amount NFTokenCreateOffer sellside`, function () {
    const validNFTokenCreateOffer = {
      TransactionType: 'NFTokenCreateOffer',
      NFTokenID: NFTOKEN_ID,
      Amount: '0',
      Flags: NFTokenCreateOfferFlags.tfSellNFToken,
      Expiration: 1000,
      Destination: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.doesNotThrow(() => validate(validNFTokenCreateOffer))
  })

  it(`throws w/ Account === Owner`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      NFTokenID: NFTOKEN_ID,
      Amount: '1',
      Expiration: 1000,
      Owner: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: Owner and Account must not be equal',
    )
  })

  it(`throws w/ Account === Destination`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      NFTokenID: NFTOKEN_ID,
      Amount: '1',
      Flags: NFTokenCreateOfferFlags.tfSellNFToken,
      Expiration: 1000,
      Destination: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: Destination and Account must not be equal',
    )
  })

  it(`throws w/out NFTokenID`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      Amount: '1',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Expiration: 1000,
      Destination: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: missing field NFTokenID',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      NFTokenID: NFTOKEN_ID,
      Amount: 1,
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Expiration: 1000,
      Destination: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: invalid Amount',
    )
  })

  it(`throws w/ missing Amount`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Expiration: 1000,
      NFTokenID: NFTOKEN_ID,
      Destination: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: invalid Amount',
    )
  })

  it(`throws w/ Owner for sell offer`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      Expiration: 1000,
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenID: NFTOKEN_ID,
      Flags: NFTokenCreateOfferFlags.tfSellNFToken,
      Amount: '1',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: Owner must not be present for sell offers',
    )
  })

  it(`throws w/out Owner for buy offer`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      Expiration: 1000,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Amount: '1',
      NFTokenID: NFTOKEN_ID,
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: Owner must be present for buy offers',
    )
  })

  it(`throws w/ 0 Amount for buy offer`, function () {
    const invalid = {
      TransactionType: 'NFTokenCreateOffer',
      Expiration: 1000,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Owner: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Amount: '0',
      Fee: '5000000',
      NFTokenID: NFTOKEN_ID,
      Sequence: 2470665,
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenCreateOffer: Amount must be greater than 0 for buy offers',
    )
  })
})
