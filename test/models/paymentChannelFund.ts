import { ValidationError } from 'ripple-api/common/errors'
import { verifyPaymentChannelFund } from './../../src/models/transactions/paymentChannelFund'
import { assert } from 'chai'

/**
 * PaymentChannelFund Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('PaymentChannelFund Transaction Verification', function () {
    
    it (`verifies valid PaymentChannelFund`, () => {
        const valid = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Amount": "200000",
            "Expiration": 543171558
        } as any
        
        assert.doesNotThrow(() => verifyPaymentChannelFund(valid))
    })

    it (`verifies valid PaymentChannelFund w/o optional`, () => {
        const valid = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Amount": "200000",
        } as any
        
        assert.doesNotThrow(() => verifyPaymentChannelFund(valid))
    })

    it (`throws w/ missing Amount`, () => {
        const missingAmt = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
        } as any

        assert.throws(
            () => verifyPaymentChannelFund(missingAmt),
            ValidationError,
            "PaymentChannelFund: missing Amount"
        )
    })

    it (`throws w/ missing Channel`, () => {
        const missingChannel = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Amount": "1000",
        } as any

        assert.throws(
            () => verifyPaymentChannelFund(missingChannel),
            ValidationError,
            "PaymentChannelFund: missing Channel"
        )
    })

    it (`throws w/ invalid Amount`, () => {
        const invalidAmt = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Amount": 100,
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
        } as any

        assert.throws(
            () => verifyPaymentChannelFund(invalidAmt),
            ValidationError,
            "PaymentChannelFund: invalid Amount"
        )
    })

    it (`throws w/ missing Channel`, () => {
        const invalidChannel = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Amount": "1000",
            "Channel": 1000
        } as any

        assert.throws(
            () => verifyPaymentChannelFund(invalidChannel),
            ValidationError,
            "PaymentChannelFund: invalid Channel"
        )
    })

    it (`throws w/ invalid Expiration`, () => {
        const invalidExpiration = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Amount": "200000",
            "Expiration": "543171558"
        } as any
        
        assert.throws(
            () => verifyPaymentChannelFund(invalidExpiration),
            ValidationError,
            "PaymentChannelFund: invalid Expiration"
        )
    })

})