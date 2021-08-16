import { ValidationError } from 'ripple-api/common/errors'
import { EscrowCancel, verifyEscrowCancel } from './../../src/models/transactions/escrowCancel'
import { assert } from 'chai'

/**
 * Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Transaction Verification', function () {
    it (`Valid EscrowCancel`, () => {
        const cancel: EscrowCancel = {
            TransactionType: "EscrowCancel",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
        }

        assert.doesNotThrow(() => verifyEscrowCancel(cancel))
    })

    it (`Invalid EscrowCancel missing owner`, () => {
        const missingOwner = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCancel",
            OfferSequence: 7,
        } as any

        assert.throws(
            () => verifyEscrowCancel(missingOwner),
            ValidationError,
            'EscrowCancel: missing Owner'
        )
    })
    
    it (`Invalid EscrowCancel missing offerSequence`, () => {

        const missingOfferSequence = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCancel",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        } as any

        assert.throws(
            () => verifyEscrowCancel(missingOfferSequence),
            ValidationError,
            'EscrowCancel: missing OfferSequence'
        )
    })

    it (`Invalid OfferSequence`, () => {
        const invalidOfferSequence = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCancel",
            OfferSequence: "7",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        } as any

        assert.throws(
            () => verifyEscrowCancel(invalidOfferSequence),
            ValidationError,
            'EscrowCancel: invalid OfferSequence'
        )
    })

    it (`Invalid owner`, () => {
        const invalidOwner = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCancel",
            OfferSequence: 7,
            Owner: 10,
        } as any

        assert.throws(
            () => verifyEscrowCancel(invalidOwner),
            ValidationError,
            'EscrowCancel: invalid Owner'
        )
    })
})