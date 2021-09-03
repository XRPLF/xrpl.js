import { assert } from 'chai'

import { ValidationError } from 'xrpl-local/common/errors'

import {
  PaymentTransactionFlagsEnum,
  verifyPayment,
} from '../../src/models/transactions/payment'

/**
 * PaymentTransaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Payment', function () {
  let paymentTransaction

  beforeEach(function () {
    paymentTransaction = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: '1234',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      DestinationTag: 1,
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      Paths: [[{ currency: 'BTC', issuer: 'apsoeijf90wp34fh' }]],
      SendMax: '100000000',
    } as any
  })

  it(`verifies valid PaymentTransaction`, function () {
    assert.doesNotThrow(() => verifyPayment(paymentTransaction))
  })

  it(`throws when Amount is missing`, function () {
    delete paymentTransaction.Amount
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: missing field Amount',
    )
  })

  it(`throws when Amount is invalid`, function () {
    paymentTransaction.Amount = 1234
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Amount',
    )
  })

  it(`throws when Destination is missing`, function () {
    delete paymentTransaction.Destination
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: missing field Destination',
    )
  })

  it(`throws when Destination is invalid`, function () {
    paymentTransaction.Destination = 7896214
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Destination',
    )
  })

  it(`throws when DestinationTag is not a number`, function () {
    paymentTransaction.DestinationTag = '1'
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: DestinationTag must be a number',
    )
  })

  it(`throws when InvoiceID is not a string`, function () {
    paymentTransaction.InvoiceID = 19832
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: InvoiceID must be a string',
    )
  })

  it(`throws when Paths is invalid`, function () {
    paymentTransaction.Paths = [[{ account: 123 }]]
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Paths',
    )
  })

  it(`throws when SendMax is invalid`, function () {
    paymentTransaction.SendMax = 100000000
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid SendMax',
    )
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a number`, function () {
    paymentTransaction.DeliverMin = '10000'
    paymentTransaction.Flags = PaymentTransactionFlagsEnum.tfPartialPayment
    assert.doesNotThrow(() => verifyPayment(paymentTransaction))
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a boolean`, function () {
    paymentTransaction.DeliverMin = '10000'
    paymentTransaction.Flags = { tfPartialPayment: true }
    assert.doesNotThrow(() => verifyPayment(paymentTransaction))
  })

  it(`throws when DeliverMin is invalid`, function () {
    paymentTransaction.DeliverMin = 10000
    paymentTransaction.Flags = { tfPartialPayment: true }
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid DeliverMin',
    )
  })

  it(`throws when tfPartialPayment flag is missing with valid DeliverMin`, function () {
    paymentTransaction.DeliverMin = '10000'
    assert.throws(
      () => verifyPayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: tfPartialPayment flag required with DeliverMin',
    )
  })
})
