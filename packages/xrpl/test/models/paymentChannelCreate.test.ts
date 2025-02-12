import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validatePaymentChannelCreate } from '../../src/models/transactions/paymentChannelCreate'

/**
 * PaymentChannelCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelCreate', function () {
  let channel

  beforeEach(function () {
    channel = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'PaymentChannelCreate',
      Amount: '10000',
      Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      SettleDelay: 86400,
      PublicKey:
        '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
      CancelAfter: 533171558,
      DestinationTag: 23480,
      SourceTag: 11747,
    }
  })

  it(`verifies valid PaymentChannelCreate`, function () {
    assert.doesNotThrow(() => validatePaymentChannelCreate(channel))
    assert.doesNotThrow(() => validate(channel))
  })

  it(`verifies valid PaymentChannelCreate w/o optional`, function () {
    delete channel.CancelAfter
    delete channel.DestinationTag
    delete channel.SourceTag

    assert.doesNotThrow(() => validatePaymentChannelCreate(channel))
    assert.doesNotThrow(() => validate(channel))
  })

  it(`missing Amount`, function () {
    delete channel.Amount

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field Amount',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field Amount',
    )
  })

  it(`missing Destination`, function () {
    delete channel.Destination

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field Destination',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field Destination',
    )
  })

  it(`missing SettleDelay`, function () {
    delete channel.SettleDelay

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field SettleDelay',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field SettleDelay',
    )
  })

  it(`missing PublicKey`, function () {
    delete channel.PublicKey

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field PublicKey',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: missing field PublicKey',
    )
  })

  it(`invalid Amount`, function () {
    channel.Amount = 1000

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field Amount',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field Amount',
    )
  })

  it(`invalid Destination`, function () {
    channel.Destination = 10

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field Destination',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field Destination',
    )
  })

  it(`invalid SettleDelay`, function () {
    channel.SettleDelay = 'abcd'

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field SettleDelay',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field SettleDelay',
    )
  })

  it(`invalid PublicKey`, function () {
    channel.PublicKey = 10

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field PublicKey',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field PublicKey',
    )
  })

  it(`invalid DestinationTag`, function () {
    channel.DestinationTag = 'abcd'

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field DestinationTag',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field DestinationTag',
    )
  })

  it(`invalid CancelAfter`, function () {
    channel.CancelAfter = 'abcd'

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field CancelAfter',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'PaymentChannelCreate: invalid field CancelAfter',
    )
  })
})
