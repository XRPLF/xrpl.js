/* eslint-disable max-statements -- need additional tests for optional fields */

import { PaymentFlags } from '../../src'
import { validatePayment } from '../../src/models/transactions/payment'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validatePayment)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePayment, message)

/**
 * PaymentTransaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Payment', function () {
  let payment: any

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
      DomainID: '5'.repeat(64),
    } as any
  })

  it(`verifies valid Payment`, function () {
    assertValid(payment)
  })

  it(`throws -- invalid DomainID type`, function () {
    const paymentTx = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: '1234',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      DomainID: { sampleDictKey: 1 },
    } as any

    assertInvalid(paymentTx, 'PaymentTransaction: invalid field DomainID')
  })

  it(`throws -- invalid DomainID , exceeds expected length`, function () {
    const paymentTx = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: '1234',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      DomainID: '5'.repeat(65),
    } as any

    assertInvalid(paymentTx, 'PaymentTransaction: invalid field DomainID')
  })

  it(`throws -- invalid DomainID , falls short of expected length`, function () {
    const paymentTx = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: '1234',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      DomainID: '5'.repeat(63),
    } as any

    assertInvalid(paymentTx, 'PaymentTransaction: invalid field DomainID')
  })

  it(`Verifies memos correctly`, function () {
    payment.Memos = [
      {
        Memo: {
          MemoData: '32324324',
        },
      },
    ]

    assertValid(payment)
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

    assertInvalid(payment, 'BaseTransaction: invalid Memos')
  })

  it(`throws when Amount is missing`, function () {
    delete payment.Amount
    assertInvalid(payment, 'PaymentTransaction: missing field Amount')
  })

  it(`throws when Amount is invalid`, function () {
    payment.Amount = 1234
    assertInvalid(payment, 'PaymentTransaction: invalid Amount')
  })

  it(`throws when Destination is missing`, function () {
    delete payment.Destination
    assertInvalid(payment, 'Payment: missing field Destination')
  })

  it(`throws when Destination is invalid`, function () {
    payment.Destination = 7896214
    assertInvalid(payment, 'Payment: invalid field Destination')
  })

  it(`throws when Destination is invalid classic address`, function () {
    payment.Destination = 'rABCD'
    assertInvalid(payment, 'Payment: invalid field Destination')
  })

  it(`does not throw when Destination is a valid x-address`, function () {
    payment.Destination = 'X7WZKEeNVS2p9Tire9DtNFkzWBZbFtSiS2eDBib7svZXuc2'
    assertValid(payment)
  })

  it(`throws when Destination is an empty string`, function () {
    payment.Destination = ''
    assertInvalid(payment, 'Payment: invalid field Destination')
  })

  it(`throws when DestinationTag is not a number`, function () {
    payment.DestinationTag = '1'
    assertInvalid(payment, 'Payment: invalid field DestinationTag')
  })

  it(`throws when InvoiceID is not a string`, function () {
    payment.InvoiceID = 19832
    assertInvalid(payment, 'PaymentTransaction: InvoiceID must be a string')
  })

  it(`throws when Paths is invalid`, function () {
    payment.Paths = [[{ account: 123 }]]
    assertInvalid(payment, 'PaymentTransaction: invalid Paths')
  })

  it(`throws when SendMax is invalid`, function () {
    payment.SendMax = 100000000
    assertInvalid(payment, 'PaymentTransaction: invalid SendMax')
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a number`, function () {
    payment.DeliverMin = '10000'
    payment.Flags = PaymentFlags.tfPartialPayment
    assertValid(payment)
  })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a boolean`, function () {
    payment.DeliverMin = '10000'
    payment.Flags = { tfPartialPayment: true }
    assertValid(payment)
  })

  it(`throws when DeliverMin is invalid`, function () {
    payment.DeliverMin = 10000
    payment.Flags = { tfPartialPayment: true }
    assertInvalid(payment, 'PaymentTransaction: invalid DeliverMin')
  })

  it(`throws when tfPartialPayment flag is missing with valid DeliverMin`, function () {
    payment.DeliverMin = '10000'
    assertInvalid(
      payment,
      'PaymentTransaction: tfPartialPayment flag required with DeliverMin',
    )
  })

  it(`verifies valid MPT PaymentTransaction`, function () {
    const mptPayment = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '10',
      },
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    } as any
    assertValid(mptPayment)
  })

  it(`throws w/ non-array CredentialIDs`, function () {
    payment.CredentialIDs =
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

    const errorMessage = 'Payment: Credentials must be an array'
    assertInvalid(payment, errorMessage)
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
    assertInvalid(payment, errorMessage)
  })

  it(`throws w/ empty CredentialIDs`, function () {
    payment.CredentialIDs = []

    const errorMessage = 'Payment: Credentials cannot be an empty array'
    assertInvalid(payment, errorMessage)
  })

  it(`throws w/ non-string CredentialIDs`, function () {
    payment.CredentialIDs = [
      123123,
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage = 'Payment: Invalid Credentials ID list format'
    assertInvalid(payment, errorMessage)
  })

  it(`throws w/ duplicate CredentialIDs`, function () {
    payment.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'Payment: Credentials cannot contain duplicate elements'
    assertInvalid(payment, errorMessage)
  })
})
