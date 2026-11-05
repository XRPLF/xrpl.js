import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validatePaymentChannelFund } from '../../src/models/transactions/paymentChannelFund'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelFund)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelFund, message)

/**
 * PaymentChannelFund Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelFund', function () {
  let channel: any

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
    assertValid(channel)
  })

  it(`verifies valid PaymentChannelFund w/o optional`, function () {
    delete channel.Expiration

    assertValid(channel)
  })

  it(`throws w/ missing Amount`, function () {
    delete channel.Amount

    assertInvalid(channel, 'PaymentChannelFund: missing field Amount')
  })

  it(`throws w/ missing Channel`, function () {
    delete channel.Channel

    assertInvalid(channel, 'PaymentChannelFund: missing field Channel')
  })

  it(`throws w/ invalid Amount`, function () {
    channel.Amount = 100

    assertInvalid(
      channel,
      'PaymentChannelFund: Amount must be an XRP, IOU or MPT amount',
    )
  })

  it(`throws w/ invalid Channel`, function () {
    channel.Channel = 1000

    assertInvalid(channel, 'PaymentChannelFund: invalid field Channel')
  })

  it(`throws w/ invalid Expiration`, function () {
    channel.Expiration = '1000'

    assertInvalid(channel, 'PaymentChannelFund: invalid field Expiration')
  })

  it(`throws w/ non-hex Channel`, function () {
    channel.Channel = 'not hex'
    assertInvalid(channel, 'PaymentChannelFund: invalid field Channel')
  })

  it(`verifies an IOU Amount`, function () {
    channel.Amount = {
      currency: 'USD',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '100.5',
    }

    assertValid(channel)
  })

  it(`verifies an MPT Amount`, function () {
    channel.Amount = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      value: '100',
    }

    assertValid(channel)
  })

  it(`throws w/ a zero XRP Amount`, function () {
    channel.Amount = '0'

    assertInvalid(channel, 'PaymentChannelFund: Amount must be greater than 0')
  })

  it(`throws w/ a negative IOU Amount`, function () {
    channel.Amount = {
      currency: 'USD',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '-1',
    }

    assertInvalid(channel, 'PaymentChannelFund: Amount must be greater than 0')
  })

  it(`throws w/ a zero MPT Amount`, function () {
    channel.Amount = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      value: '0',
    }

    assertInvalid(channel, 'PaymentChannelFund: Amount must be greater than 0')
  })

  it(`throws w/ a malformed token Amount`, function () {
    channel.Amount = { currency: 'USD' }

    assertInvalid(
      channel,
      'PaymentChannelFund: Amount must be an XRP, IOU or MPT amount',
    )
  })

  it(`throws w/ an IOU Amount using the XRP currency code`, function () {
    channel.Amount = {
      currency: 'XRP',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '1',
    }

    assert.throws(
      () => validatePaymentChannelFund(channel),
      ValidationError,
      'PaymentChannelFund: Amount cannot be an issued currency with the code XRP',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'Cannot have an issued currency with a similar standard code to XRP',
    )
  })
})
