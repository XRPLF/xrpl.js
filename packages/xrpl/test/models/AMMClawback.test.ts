import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import {
  AMMClawbackFlags,
  validateAMMClawback,
} from '../../src/models/transactions/AMMClawback'

/**
 * AMMClawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMClawback', function () {
  let ammClawback

  beforeEach(function () {
    ammClawback = {
      TransactionType: 'AMMClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
      Asset: {
        currency: 'USD',
        issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      },
      Asset2: {
        currency: 'XRP',
      },
      Amount: {
        currency: 'USD',
        issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        value: '1000',
      },
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMClawback`, function () {
    assert.doesNotThrow(() => validateAMMClawback(ammClawback))
    assert.doesNotThrow(() => validate(ammClawback))
  })

  it(`verifies valid AMMClawback without Amount`, function () {
    delete ammClawback.Amount
    assert.doesNotThrow(() => validateAMMClawback(ammClawback))
    assert.doesNotThrow(() => validate(ammClawback))
  })

  it(`verifies valid AMMClawback with tfClawTwoAssets`, function () {
    ammClawback.flags = AMMClawbackFlags.tfClawTwoAssets
    assert.doesNotThrow(() => validateAMMClawback(ammClawback))
    assert.doesNotThrow(() => validate(ammClawback))
  })

  it(`throws w/ missing Holder`, function () {
    delete ammClawback.Holder
    const errorMessage = 'AMMClawback: missing field Holder'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ invalid field Holder`, function () {
    ammClawback.Holder = 1234
    const errorMessage = 'AMMClawback: invalid field Holder'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ Holder and Asset.issuer must be distinct`, function () {
    ammClawback.Holder = ammClawback.Asset.issuer
    const errorMessage = 'AMMClawback: Holder and Asset.issuer must be distinct'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ missing Asset`, function () {
    delete ammClawback.Asset
    const errorMessage = 'AMMClawback: missing field Asset'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ invalid field Asset`, function () {
    ammClawback.Asset = '1000'
    const errorMessage = 'AMMClawback: invalid field Asset'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ Account must be the same as Asset.issuer`, function () {
    ammClawback.Account = 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn'
    const errorMessage = 'AMMClawback: Account must be the same as Asset.issuer'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ missing Asset2`, function () {
    delete ammClawback.Asset2
    const errorMessage = 'AMMClawback: missing field Asset2'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ invalid field Asset2`, function () {
    ammClawback.Asset2 = '1000'
    const errorMessage = 'AMMClawback: invalid field Asset2'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ invalid field Amount`, function () {
    ammClawback.Amount = 1000
    const errorMessage = 'AMMClawback: invalid field Amount'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ Amount.currency must match Asset.currency`, function () {
    ammClawback.Amount.currency = 'ETH'
    const errorMessage =
      'AMMClawback: Amount.currency must match Asset.currency'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })

  it(`throws w/ Amount.issuer must match Amount.issuer`, function () {
    ammClawback.Amount.issuer = 'rnYgaEtpqpNRt3wxE39demVpDAA817rQEY'
    const errorMessage = 'AMMClawback: Amount.issuer must match Amount.issuer'
    assert.throws(
      () => validateAMMClawback(ammClawback),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(ammClawback), ValidationError, errorMessage)
  })
})
