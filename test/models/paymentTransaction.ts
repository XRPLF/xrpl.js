import { ValidationError } from 'xrpl-local/common/errors'
import { PaymentTransactionFlagsEnum, verifyPaymentTransaction } from './../../src/models/transactions/paymentTransaction'
import { assert } from 'chai'

/**
 * PaymentTransaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Payment Transaction Verification', () => {
    let paymentTransaction

    beforeEach(() => {
        paymentTransaction = {
            TransactionType: 'Payment',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
            Amount: '1234',
            Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
            DestinationTag: 1,
            InvoiceID: '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
            Paths: [[{ account: 'aw0efji', currency: 'XRP', issuer: 'apsoeijf90wp34fh'}]],
            SendMax: '100000000',
        } as any
    })

    it (`verifies valid PaymentTransaction`, () => {
        assert.doesNotThrow(() => verifyPaymentTransaction(paymentTransaction))
    })

    it (`throws when Amount is missing`, () => {
        delete paymentTransaction.Amount
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: missing field Amount'
        )
    })

    it (`throws when Amount is invalid`, () => {
        paymentTransaction.Amount = 1234
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid Amount'
        )
    })

    it (`throws when Destination is missing`, () => {
        delete paymentTransaction.Destination
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: missing field Destination'
        )
    })

    it (`throws when Destination is invalid`, () => {
        paymentTransaction.Destination = 7896214
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid Destination'
        )
    })

    it (`throws when DestinationTag is not a number`, () => {
        paymentTransaction.DestinationTag = '1'
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: DestinationTag must be a number'
        )
    })

    it (`throws when InvoiceID is not a string`, () => {
        paymentTransaction.InvoiceID = 19832
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: InvoiceID must be a string'
        )
    })

    it (`throws when Paths is invalid`, () => {
        paymentTransaction.Paths = [[{ account: 123 }]]
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid Paths'
        )
    })

    it (`throws when SendMax is invalid`, () => {
        paymentTransaction.SendMax = 100000000
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid SendMax'
        )
    })

    it (`verifies valid DeliverMin with tfPartialPayment flag set as a number`, () => {
        paymentTransaction.DeliverMin = '10000'
        paymentTransaction.Flags = PaymentTransactionFlagsEnum.tfPartialPayment,
        assert.doesNotThrow(() => verifyPaymentTransaction(paymentTransaction))
    })

    it (`verifies valid DeliverMin with tfPartialPayment flag set as a boolean`, () => {
        paymentTransaction.DeliverMin = '10000'
        paymentTransaction.Flags = { tfPartialPayment: true }
        assert.doesNotThrow(() => verifyPaymentTransaction(paymentTransaction))
    })

    it (`throws when DeliverMin is invalid`, () => {
        paymentTransaction.DeliverMin = 10000
        paymentTransaction.Flags = { tfPartialPayment: true }
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid DeliverMin'
        )
    })

    it (`throws when tfPartialPayment flag is missing with valid DeliverMin`, () => {
        paymentTransaction.DeliverMin = '10000'
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: tfPartialPayment flag required with DeliverMin'
        )
    })
})
