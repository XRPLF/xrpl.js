import { ValidationError } from 'xrpl-local/common/errors'
import { EscrowFinish, verifyEscrowFinish } from './../../src/models/transactions/escrowFinish'
import { assert } from 'chai'

/**
 * EscrowFinish Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('EscrowFinish Transaction Verification', function () {   
    it (`verifies valid EscrowFinish`, () => {
        const validCheck: EscrowFinish = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
            Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
            Fulfillment: "A0028000"
        }
                    
        assert.doesNotThrow(() => verifyEscrowFinish(validCheck))
    })

    it (`verifies valid EscrowFinish w/o optional`, () => {
        const validCheck: EscrowFinish = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
        }
                    
        assert.doesNotThrow(() => verifyEscrowFinish(validCheck))
    })


    it (`throws w/ invalid Owner`, () => {
        const invalidOwner = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: 0x15415253,
            OfferSequence: "10",
        } as any

        assert.throws(
            () => verifyEscrowFinish(invalidOwner),
            ValidationError,
            "EscrowFinish: invalid Owner"
        )
    })

    it (`throws w/ invalid OfferSequence`, () => {
        const invalidSeq = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: "10",
        } as any

        assert.throws(
            () => verifyEscrowFinish(invalidSeq),
            ValidationError,
            "EscrowFinish: invalid OfferSequence"
        )
    })

    it (`throws w/ invalid Condition`, () => {
        const invalidCondition = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
            Condition: 10
        } as any

        assert.throws(
            () => verifyEscrowFinish(invalidCondition),
            ValidationError,
            "EscrowFinish: invalid Condition"
        )
    })

    it (`throws w/ invalid Fulfillment`, () => {
        const invalidFulfillment = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
            Fulfillment: 10
        } as any

        assert.throws(
            () => verifyEscrowFinish(invalidFulfillment),
            ValidationError,
            "EscrowFinish: invalid Fulfillment"
        )
    })
})