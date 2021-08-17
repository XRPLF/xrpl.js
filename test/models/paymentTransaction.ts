import { ValidationError } from 'xrpl-local/common/errors'
import { PaymentTransactionFlagsEnum, verifyPaymentTransaction } from './../../src/models/transactions/paymentTransaction'
import { assert } from 'chai'

/**
 * Payment Transaction Verification Testing
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

    it (`throws w/ missing Amount`, () => {
        delete paymentTransaction.Amount
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: missing field Amount'
        )
    })

    it (`throws w/ invalid Amount`, () => {
        paymentTransaction.Amount = 1234
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid Amount'
        )
    })

    it (`throws w/ missing Destination`, () => {
        delete paymentTransaction.Destination
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: missing field Destination'
        )
    })

    it (`throws w/ invalid Destination`, () => {
        paymentTransaction.Destination = 7896214
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid Destination'
        )
    })

    it (`throws w/ invalid DestinationTag`, () => {
        paymentTransaction.DestinationTag = '1'
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid DestinationTag'
        )
    })

    it (`throws w/ invalid InvoiceID`, () => {
        paymentTransaction.InvoiceID = 19832
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid InvoiceID'
        )
    })

    it (`throws w/ invalid Paths`, () => {
        paymentTransaction.Paths = [[{ account: 123 }]]
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid Paths'
        )
    })

    it (`throws w/ invalid SendMax`, () => {
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

    it (`throws w/ invalid DeliverMin`, () => {
        paymentTransaction.DeliverMin = 10000
        paymentTransaction.Flags = { tfPartialPayment: true }
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: invalid DeliverMin'
        )
    })

    it (`throws w/ tfPartialPayment flag missing with DeliverMin`, () => {
        paymentTransaction.DeliverMin = '10000'
        assert.throws(
            () => verifyPaymentTransaction(paymentTransaction),
            ValidationError,
            'PaymentTransaction: missing tfPartialPayment flag with DeliverMin'
        )
    })
})
