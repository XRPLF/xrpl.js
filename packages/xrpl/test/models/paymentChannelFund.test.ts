import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validatePaymentChannelFund } from '../../src/models/transactions/paymentChannelFund'

/**
 * PaymentChannelFund Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelFund', function () {
  let channel

  beforeEach(function () {
    channel = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'PaymentChannelFund',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Amount: '200000',
      Expiration: 543171558,
    }
  })

  it(`verifies valid PaymentChannelFund`, function () {
    assert.doesNotThrow(() => validatePaymentChannelFund(channel))
    assert.doesNotThrow(() => validate(channel))
  })

  it(`verifies valid PaymentChannelFund w/o optional`, function () {
    delete channel.Expiration

    assert.doesNotThrow(() => validatePaymentChannelFund(channel))
    assert.doesNotThrow(() => validate(channel))
  })

  it(`throws w/ missing Amount`, function () {
    delete channel.Amount

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: missing field Amount',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: missing field Amount',
    )
  })

  it(`throws w/ missing Channel`, function () {
    delete channel.Channel

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: missing field Channel',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: missing field Channel',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    channel.Amount = 100

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: invalid field Amount',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: invalid field Amount',
    )
  })

  it(`throws w/ invalid Channel`, function () {
    channel.Channel = 1000

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: invalid field Channel',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: invalid field Channel',
    )
  })

  it(`throws w/ invalid Expiration`, function () {
    channel.Expiration = 'abcd'

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: invalid field Expiration',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: invalid field Expiration',
    )
  })
})
