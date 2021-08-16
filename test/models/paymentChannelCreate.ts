import { ValidationError } from 'ripple-api/common/errors'
import { PaymentChannelCreate, verifyPaymentChannelCreate } from './../../src/models/transactions/paymentChannelCreate'
import { assert } from 'chai'

/**
 * PaymentChannelCreate Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('PaymentChannelCreate Transaction Verification', function () {
    
    it (`verifies valid PaymentChannelCreate`, () => {
        const validPaymentChannel: PaymentChannelCreate = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
            "CancelAfter": 533171558,
            "DestinationTag": 23480,
            "SourceTag": 11747
        }        
        
        assert.doesNotThrow(() => verifyPaymentChannelCreate(validPaymentChannel))
    })

    it (`verifies valid PaymentChannelCreate`, () => {
        const validPaymentChannel: PaymentChannelCreate = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        }        
        
        assert.doesNotThrow(() => verifyPaymentChannelCreate(validPaymentChannel))
    })

    it (`missing Amount`, () => {
        const missingAmt = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        } as any
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingAmt),
            ValidationError,
            "PaymentChannelCreate: missing Amount"
        )
    })


    it (`missing Destination`, () => {
        const missingDest = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingDest),
            ValidationError,
            "PaymentChannelCreate: missing Destination"
        )
    })

    it (`missing SettleDelay`, () => {
        const missingSettleDelay = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingSettleDelay),
            ValidationError,
            "PaymentChannelCreate: missing SettleDelay"
        )
    })

    it (`missing PublicKey`, () => {
        const missingKey = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingKey),
            ValidationError,
            "PaymentChannelCreate: missing PublicKey"
        )
    })

    it (`invalid Amount`, () => {
        const missingAmt = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": 10,
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        } as any
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingAmt),
            ValidationError,
            "PaymentChannelCreate: invalid Amount"
        )
    })


    it (`invalid Destination`, () => {
        const missingDest = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": 10,
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingDest),
            ValidationError,
            "PaymentChannelCreate: invalid Destination"
        )
    })

    it (`invalid SettleDelay`, () => {
        const missingSettleDelay = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": "8048",
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingSettleDelay),
            ValidationError,
            "PaymentChannelCreate: invalid SettleDelay"
        )
    })

    it (`invalid PublicKey`, () => {
        const missingKey = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": 1000
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(missingKey),
            ValidationError,
            "PaymentChannelCreate: invalid PublicKey"
        )
    })

    it (`invalid DestinationTag`, () => {
        const invalidDestTag = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "1000",
            "DestinationTag": "120023"
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(invalidDestTag),
            ValidationError,
            "PaymentChannelCreate: invalid DestinationTag"
        )
    })

    it (`invalid CancelAfter`, () => {
        const invalidCancelAfter = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "1000",
            "CancelAfter": "120023"
        } as any       
        
        assert.throws(
            () => verifyPaymentChannelCreate(invalidCancelAfter),
            ValidationError,
            "PaymentChannelCreate: invalid CancelAfter"
        )
    })
})