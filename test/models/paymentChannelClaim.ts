import { ValidationError } from 'xrpl-local/common/errors'
import { verifyPaymentChannelClaim } from './../../src/models/transactions/paymentChannelClaim'
import { assert } from 'chai'


/**
 * PaymentChannelClaim Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('PaymentChannelClaim Transaction Verification', function () {
    let channel

    beforeEach(() => {
        channel = {
            "Account": "r...",
            "TransactionType": "PaymentChannelClaim",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Balance": "1000000",
            "Amount": "1000000",
            "Signature": "30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA3CD7B9B",
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A"
        }
    })

    it (`verifies valid PaymentChannelClaim`, () => {
        assert.doesNotThrow(() => verifyPaymentChannelClaim(channel))
    })

    it (`verifies valid PaymentChannelClaim w/o optional`, () => {
        delete channel.Balance
        delete channel.Amount
        delete channel.Signature
        delete channel.PublicKey
        
        assert.doesNotThrow(() => verifyPaymentChannelClaim(channel))
    })

    it (`throws w/ missing Channel`, () => {
        delete channel.Channel
        
        assert.throws(
            () => verifyPaymentChannelClaim(channel),
            ValidationError,
            "PaymentChannelClaim: missing Channel"
        )
    })

    it (`throws w/ invalid Channel`, () => {
        channel.Channel = 100
        
        assert.throws(
            () => verifyPaymentChannelClaim(channel),
            ValidationError,
            "PaymentChannelClaim: Channel must be a string"
        )
    })

    it (`throws w/ invalid Balance`, () => {
        channel.Balance = 100
        
        assert.throws(
            () => verifyPaymentChannelClaim(channel),
            ValidationError,
            "PaymentChannelClaim: Balance must be a string"
        )
    })

    it (`throws w/ invalid Amount`, () => {
        channel.Amount = 1000
        
        assert.throws(
            () => verifyPaymentChannelClaim(channel),
            ValidationError,
            "PaymentChannelClaim: Amount must be a string"
        )
    })

    it (`throws w/ invalid Signature`, () => {
        channel.Signature = 1000
        
        assert.throws(
            () => verifyPaymentChannelClaim(channel),
            ValidationError,
            "PaymentChannelClaim: Signature must be a string"
        )
    })

    it (`throws w/ invalid PublicKey`, () => {
        channel.PublicKey = ["100000"]
        
        assert.throws(
            () => verifyPaymentChannelClaim(channel),
            ValidationError,
            "PaymentChannelClaim: PublicKey must be a string"
        )
    })
})