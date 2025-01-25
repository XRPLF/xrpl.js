/* eslint-disable max-statements -- need additional tests for optional fields */
import { assert } from 'chai'

import { validate, PaymentFlags, ValidationError } from '../../src'
import { validatePayment } from '../../src/models/transactions/payment'

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
      Fee: '12',
      Flags: 2147483648,
      LastLedgerSequence: 65953073,
      Sequence: 65923914,
      SigningPubKey:
        '02F9E33F16DF9507705EC954E3F94EB5F10D1FC4A354606DBE6297DBB1096FE654',
      TxnSignature:
        '3045022100E3FAE0EDEC3D6A8FF6D81BC9CF8288A61B7EEDE8071E90FF9314CB4621058D10022043545CF631706D700CEE65A1DB83EFDD185413808292D9D90F14D87D3DC2D8CB',
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      Paths: [
        [{ currency: 'BTC', issuer: 'r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X' }],
      ],
      SendMax: '100000000',
    } as any
  })

  it(`verifies valid PaymentTransaction`, function () {
    assert.doesNotThrow(() => validatePayment(paymentTransaction))
    assert.doesNotThrow(() => validate(paymentTransaction))
  })

  it(`Verifies memos correctly`, function () {
    paymentTransaction.Memos = [
      {
        Memo: {
          MemoData: '32324324',
        },
      },
    ]

    assert.doesNotThrow(() => validate(paymentTransaction))
  })

  it(`Verifies memos correctly`, function () {
    paymentTransaction.Memos = [
      {
        Memo: {
          MemoData: '32324324',
          MemoType: 121221,
        },
      },
    ]

    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'BaseTransaction: invalid Memos',
    )
  })

  it(`throws when Amount is missing`, function () {
    delete paymentTransaction.Amount
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: missing field Amount',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: missing field Amount',
    )
  })

  it(`throws when Amount is invalid`, function () {
    paymentTransaction.Amount = 1234
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Amount',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Amount',
    )
  })

  it(`throws when Destination is missing`, function () {
    delete paymentTransaction.Destination
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'Payment: missing field Destination',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'Payment: missing field Destination',
    )
  })

  it(`throws when Destination is invalid`, function () {
    paymentTransaction.Destination = 7896214
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'Payment: invalid field Destination',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'Payment: invalid field Destination',
    )
  })

  it(`throws when Destination is invalid classic address`, function () {
    paymentTransaction.Destination = 'rABCD'
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'Payment: invalid field Destination',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'Payment: invalid field Destination',
    )
  })

  it(`does not throw when Destination is a valid x-address`, function () {
    paymentTransaction.Destination =
      'X7WZKEeNVS2p9Tire9DtNFkzWBZbFtSiS2eDBib7svZXuc2'
    assert.doesNotThrow(() => validatePayment(paymentTransaction))
    assert.doesNotThrow(() => validate(paymentTransaction))
  })

  it(`throws when Destination is an empty string`, function () {
    paymentTransaction.Destination = ''
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'Payment: invalid field Destination',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'Payment: invalid field Destination',
    )
  })

  it(`throws when DestinationTag is not a number`, function () {
    paymentTransaction.DestinationTag = '1'
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'Payment: invalid field DestinationTag',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'Payment: invalid field DestinationTag',
    )
  })

  it(`throws when InvoiceID is not a string`, function () {
    paymentTransaction.InvoiceID = 19832
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: InvoiceID must be a string',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: InvoiceID must be a string',
    )
  })

  it(`throws when Paths is invalid`, function () {
    paymentTransaction.Paths = [[{ account: 123 }]]
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Paths',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid Paths',
    )
  })

  it(`throws when SendMax is invalid`, function () {
    paymentTransaction.SendMax = 100000000
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid SendMax',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid SendMax',
    )
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a number`, function () {
    paymentTransaction.DeliverMin = '10000'
    paymentTransaction.Flags = PaymentFlags.tfPartialPayment
    assert.doesNotThrow(() => validatePayment(paymentTransaction))
    assert.doesNotThrow(() => validate(paymentTransaction))
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a boolean`, function () {
    paymentTransaction.DeliverMin = '10000'
    paymentTransaction.Flags = { tfPartialPayment: true }
    assert.doesNotThrow(() => validatePayment(paymentTransaction))
    assert.doesNotThrow(() => validate(paymentTransaction))
  })

  it(`throws when DeliverMin is invalid`, function () {
    paymentTransaction.DeliverMin = 10000
    paymentTransaction.Flags = { tfPartialPayment: true }
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid DeliverMin',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: invalid DeliverMin',
    )
  })

  it(`throws when tfPartialPayment flag is missing with valid DeliverMin`, function () {
    paymentTransaction.DeliverMin = '10000'
    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      'PaymentTransaction: tfPartialPayment flag required with DeliverMin',
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      'PaymentTransaction: tfPartialPayment flag required with DeliverMin',
    )
  })

  it(`verifies valid MPT PaymentTransaction`, function () {
    const mptPaymentTransaction = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '10',
      },
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    } as any
    assert.doesNotThrow(() => validatePayment(mptPaymentTransaction))
    assert.doesNotThrow(() => validate(mptPaymentTransaction))
  })

  it(`throws w/ non-array CredentialIDs`, function () {
    paymentTransaction.CredentialIDs =
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

    const errorMessage = 'Payment: Credentials must be an array'

    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws CredentialIDs length exceeds max length`, function () {
    paymentTransaction.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66B',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66C',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66D',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66E',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66F',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F660',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F661',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage = 'Payment: Credentials length cannot exceed 8 elements'

    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ empty CredentialIDs`, function () {
    paymentTransaction.CredentialIDs = []

    const errorMessage = 'Payment: Credentials cannot be an empty array'

    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ non-string CredentialIDs`, function () {
    paymentTransaction.CredentialIDs = [
      123123,
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage = 'Payment: Invalid Credentials ID list format'

    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ duplicate CredentialIDs`, function () {
    paymentTransaction.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'Payment: Credentials cannot contain duplicate elements'

    assert.throws(
      () => validatePayment(paymentTransaction),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(paymentTransaction),
      ValidationError,
      errorMessage,
    )
  })
})
