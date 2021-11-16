import { assert } from 'chai'

import { validate, ValidationError } from 'xrpl-local'
import { validatePaymentChannelFund } from 'xrpl-local/models/transactions/paymentChannelFund'

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
      'PaymentChannelFund: missing Amount',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: missing Amount',
    )
  })

  it(`throws w/ missing Channel`, function () {
    delete channel.Channel

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: missing Channel',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: missing Channel',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    channel.Amount = 100

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: Amount must be a string',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: Amount must be a string',
    )
  })

  it(`throws w/ invalid Channel`, function () {
    channel.Channel = 1000

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: Channel must be a string',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: Channel must be a string',
    )
  })

  it(`throws w/ invalid Expiration`, function () {
    channel.Expiration = '1000'

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: Expiration must be a number',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelFund: Expiration must be a number',
    )
  })
})
