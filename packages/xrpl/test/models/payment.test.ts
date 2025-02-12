/* eslint-disable max-statements -- need additional tests for optional fields */
import { assert } from 'chai'

import { validate, PaymentFlags, ValidationError } from '../../src'
import { validatePayment } from '../../src/models/transactions/payment'

/**
 * Payment Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Payment', function () {
  let payment

  beforeEach(function () {
    payment = {
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

  it(`verifies valid Payment`, function () {
    assert.doesNotThrow(() => validatePayment(payment))
    assert.doesNotThrow(() => validate(payment))
  })

  it(`Verifies memos correctly`, function () {
    payment.Memos = [
      {
        Memo: {
          MemoData: '32324324',
        },
      },
    ]

    assert.doesNotThrow(() => validate(payment))
  })

  it(`Verifies memos correctly`, function () {
    payment.Memos = [
      {
        Memo: {
          MemoData: '32324324',
          MemoType: 121221,
        },
      },
    ]

    assert.throws(
      () => validate(payment),
      ValidationError,
      'BaseTransaction: invalid field Memos',
    )
  })

  it(`throws when Amount is missing`, function () {
    delete payment.Amount
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: missing field Amount',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: missing field Amount',
    )
  })

  it(`throws when Amount is invalid`, function () {
    payment.Amount = 1234
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field Amount',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field Amount',
    )
  })

  it(`throws when Destination is missing`, function () {
    delete payment.Destination
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: missing field Destination',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: missing field Destination',
    )
  })

  it(`throws when Destination is invalid`, function () {
    payment.Destination = 7896214
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field Destination',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field Destination',
    )
  })

  it(`throws when Destination is invalid classic address`, function () {
    payment.Destination = 'rABCD'
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field Destination',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field Destination',
    )
  })

  it(`does not throw when Destination is a valid x-address`, function () {
    payment.Destination = 'X7WZKEeNVS2p9Tire9DtNFkzWBZbFtSiS2eDBib7svZXuc2'
    assert.doesNotThrow(() => validatePayment(payment))
    assert.doesNotThrow(() => validate(payment))
  })

  it(`throws when Destination is an empty string`, function () {
    payment.Destination = ''
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field Destination',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field Destination',
    )
  })

  it(`throws when DestinationTag is not a number`, function () {
    payment.DestinationTag = 'abcd'
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field DestinationTag',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field DestinationTag',
    )
  })

  it(`throws when InvoiceID is not a string`, function () {
    payment.InvoiceID = 19832
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field InvoiceID',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field InvoiceID',
    )
  })

  it(`throws when Paths is invalid`, function () {
    payment.Paths = [[{ account: 123 }]]
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field Paths',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field Paths',
    )
  })

  it(`throws when SendMax is invalid`, function () {
    payment.SendMax = 100000000
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field SendMax',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field SendMax',
    )
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a number`, function () {
    payment.DeliverMin = '10000'
    payment.Flags = PaymentFlags.tfPartialPayment
    assert.doesNotThrow(() => validatePayment(payment))
    assert.doesNotThrow(() => validate(payment))
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a boolean`, function () {
    payment.DeliverMin = '10000'
    payment.Flags = { tfPartialPayment: true }
    assert.doesNotThrow(() => validatePayment(payment))
    assert.doesNotThrow(() => validate(payment))
  })

  it(`throws when DeliverMin is invalid`, function () {
    payment.DeliverMin = 10000
    payment.Flags = { tfPartialPayment: true }
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: invalid field DeliverMin',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: invalid field DeliverMin',
    )
  })

  it(`throws when tfPartialPayment flag is missing with valid DeliverMin`, function () {
    payment.DeliverMin = '10000'
    assert.throws(
      () => validatePayment(payment),
      ValidationError,
      'Payment: tfPartialPayment flag required with DeliverMin',
    )
    assert.throws(
      () => validate(payment),
      ValidationError,
      'Payment: tfPartialPayment flag required with DeliverMin',
    )
  })

  it(`verifies valid MPT Payment`, function () {
    const mptPayment = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '10',
      },
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    } as any
    assert.doesNotThrow(() => validatePayment(mptPayment))
    assert.doesNotThrow(() => validate(mptPayment))
  })

  it(`throws w/ non-array CredentialIDs`, function () {
    payment.CredentialIDs =
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

    const errorMessage = 'Payment: invalid field Credentials'

    assert.throws(() => validatePayment(payment), ValidationError, errorMessage)
    assert.throws(() => validate(payment), ValidationError, errorMessage)
  })

  it(`throws CredentialIDs length exceeds max length`, function () {
    payment.CredentialIDs = [
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

    assert.throws(() => validatePayment(payment), ValidationError, errorMessage)
    assert.throws(() => validate(payment), ValidationError, errorMessage)
  })

  it(`throws w/ empty CredentialIDs`, function () {
    payment.CredentialIDs = []

    const errorMessage = 'Payment: Credentials cannot be an empty array'

    assert.throws(() => validatePayment(payment), ValidationError, errorMessage)
    assert.throws(() => validate(payment), ValidationError, errorMessage)
  })

  it(`throws w/ non-string CredentialIDs`, function () {
    payment.CredentialIDs = [
      123123,
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage = 'Payment: Invalid Credentials ID list format'

    assert.throws(() => validatePayment(payment), ValidationError, errorMessage)
    assert.throws(() => validate(payment), ValidationError, errorMessage)
  })

  it(`throws w/ duplicate CredentialIDs`, function () {
    payment.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'Payment: Credentials cannot contain duplicate elements'

    assert.throws(() => validatePayment(payment), ValidationError, errorMessage)
    assert.throws(() => validate(payment), ValidationError, errorMessage)
  })
})
