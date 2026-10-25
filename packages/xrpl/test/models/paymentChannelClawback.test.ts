import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { PaymentChannelClawback } from '../../src/models/transactions'
import { validatePaymentChannelClawback } from '../../src/models/transactions/paymentChannelClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelClawback)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelClawback, message)

/**
 * PaymentChannelClawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for the PaymentChannelClawback transaction type.
 */
describe('PaymentChannelClawback', function () {
  let tx: PaymentChannelClawback

  beforeEach(function () {
    tx = {
      TransactionType: 'PaymentChannelClawback',
      Account: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Amount: {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '10',
      },
    }
  })

  it('verifies valid PaymentChannelClawback with an IOU Amount', function () {
    assertValid(tx)
  })

  it('verifies valid PaymentChannelClawback with an MPT Amount', function () {
    tx.Amount = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      value: '10',
    }
    assertValid(tx)
  })

  it('verifies valid PaymentChannelClawback without Amount', function () {
    delete tx.Amount
    assertValid(tx)
  })

  it('throws w/ missing Channel', function () {
    // @ts-expect-error for test
    delete tx.Channel
    assertInvalid(tx, 'PaymentChannelClawback: missing field Channel')
  })

  it('throws w/ non-string Channel', function () {
    // @ts-expect-error for test
    tx.Channel = 123
    assertInvalid(tx, 'PaymentChannelClawback: invalid field Channel')
  })

  it('throws w/ Channel that is not a 256-bit hex ID', function () {
    tx.Channel = 'C1AE6DDDEEC05CF2'
    assertInvalid(tx, 'PaymentChannelClawback: invalid field Channel')
  })

  it('throws w/ an XRP Amount', function () {
    // @ts-expect-error for test
    tx.Amount = '1000000'
    assertInvalid(tx, 'PaymentChannelClawback: invalid field Amount')
  })

  it('throws w/ a malformed Amount', function () {
    // @ts-expect-error for test
    tx.Amount = { currency: 'USD' }
    assertInvalid(tx, 'PaymentChannelClawback: invalid field Amount')
  })

  it('throws w/ a zero Amount', function () {
    tx.Amount = {
      currency: 'USD',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '0',
    }
    assertInvalid(tx, 'PaymentChannelClawback: Amount must be greater than 0')
  })

  it('throws w/ a negative MPT Amount', function () {
    tx.Amount = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
      value: '-5',
    }
    assertInvalid(tx, 'PaymentChannelClawback: Amount must be greater than 0')
  })

  it('throws w/ an IOU Amount using the XRP currency code', function () {
    tx.Amount = {
      currency: 'XRP',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
      value: '1',
    }
    assert.throws(
      () => validatePaymentChannelClawback(tx),
      ValidationError,
      'PaymentChannelClawback: Amount cannot be an issued currency with the code XRP',
    )
    assert.throws(
      () => validate(tx as any),
      ValidationError,
      'Cannot have an issued currency with a similar standard code to XRP',
    )
  })
})
