import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validatePaymentChannelCreate } from '../../src/models/transactions/paymentChannelCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelCreate, message)

/**
 * PaymentChannelCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelCreate', function () {
  let channel: any

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
    assertValid(channel)
  })

  it(`verifies valid PaymentChannelCreate w/o optional`, function () {
    delete channel.CancelAfter
    delete channel.DestinationTag
    delete channel.SourceTag

    assertValid(channel)
  })

  it(`missing Amount`, function () {
    delete channel.Amount

    assertInvalid(channel, 'PaymentChannelCreate: missing field Amount')
  })

  it(`missing Destination`, function () {
    delete channel.Destination

    assertInvalid(channel, 'PaymentChannelCreate: missing field Destination')
  })

  it(`missing SettleDelay`, function () {
    delete channel.SettleDelay

    assertInvalid(channel, 'PaymentChannelCreate: missing field SettleDelay')
  })

  it(`missing PublicKey`, function () {
    delete channel.PublicKey

    assertInvalid(channel, 'PaymentChannelCreate: missing field PublicKey')
  })

  it(`invalid Amount`, function () {
    channel.Amount = 1000

    assertInvalid(
      channel,
      'PaymentChannelCreate: Amount must be an XRP, IOU or MPT amount',
    )
  })

  it(`invalid Destination`, function () {
    channel.Destination = 10

    assertInvalid(channel, 'PaymentChannelCreate: invalid field Destination')
  })

  it(`invalid SettleDelay`, function () {
    channel.SettleDelay = '10'

    assertInvalid(channel, 'PaymentChannelCreate: invalid field SettleDelay')
  })

  it(`invalid PublicKey`, function () {
    channel.PublicKey = 10

    assertInvalid(channel, 'PaymentChannelCreate: invalid field PublicKey')
  })

  it(`invalid DestinationTag`, function () {
    channel.DestinationTag = '10'

    assertInvalid(channel, 'PaymentChannelCreate: invalid field DestinationTag')
  })

  it(`invalid CancelAfter`, function () {
    channel.CancelAfter = '100'

    assertInvalid(channel, 'PaymentChannelCreate: invalid field CancelAfter')
  })

  it(`throws w/ non-hex PublicKey`, function () {
    channel.PublicKey = 'not hex'
    assertInvalid(channel, 'PaymentChannelCreate: invalid field PublicKey')
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

    assertInvalid(
      channel,
      'PaymentChannelCreate: Amount must be greater than 0',
    )
  })

  it(`throws w/ a negative IOU Amount`, function () {
    channel.Amount = {
      currency: 'USD',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '-1',
    }

    assertInvalid(
      channel,
      'PaymentChannelCreate: Amount must be greater than 0',
    )
  })

  it(`throws w/ a zero MPT Amount`, function () {
    channel.Amount = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      value: '0',
    }

    assertInvalid(
      channel,
      'PaymentChannelCreate: Amount must be greater than 0',
    )
  })

  it(`throws w/ a malformed token Amount`, function () {
    channel.Amount = { currency: 'USD' }

    assertInvalid(
      channel,
      'PaymentChannelCreate: Amount must be an XRP, IOU or MPT amount',
    )
  })

  it(`throws w/ an IOU Amount using the XRP currency code`, function () {
    channel.Amount = {
      currency: 'XRP',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '1',
    }

    assert.throws(
      () => validatePaymentChannelCreate(channel),
      ValidationError,
      'PaymentChannelCreate: Amount cannot be an issued currency with the code XRP',
    )
    assert.throws(
      () => validate(channel),
      ValidationError,
      'Cannot have an issued currency with a similar standard code to XRP',
    )
  })
})
