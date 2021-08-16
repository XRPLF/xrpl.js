import { ValidationError } from 'ripple-api/common/errors'
import { verifyAccountSet } from './../../src/models/transactions/accountSet'
import { assert } from 'chai'

/**
 * AccountSet Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('AccountSet Transaction Verification', function () {

    it (`verifies valid AccountSet`, () => {
        const account = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : "6578616D706C652E636F6D",
            SetFlag : 5,
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any
            
        assert.doesNotThrow(() => verifyAccountSet(account))
    })

    it (`throws w/ invalid SetFlag (out of range)`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : "6578616D706C652E636F6D",
            SetFlag : 12,
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid SetFlag"
        )
    })

    it (`throws w/ invalid SetFlag (incorrect type)`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : "6578616D706C652E636F6D",
            SetFlag : 'abc',
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid SetFlag"
        )
    })

    it (`throws w/ invalid ClearFlag`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : "6578616D706C652E636F6D",
            ClearFlag : 12,
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid ClearFlag"
        )
    })

    it (`throws w/ invalid Domain`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : 6578616,
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid Domain"
        )
    })

    it (`throws w/ invalid EmailHash`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            EmailHash : 657861645678909876543456789876543
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid EmailHash"
        )
    })

    it (`throws w/ invalid MessageKey`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            MessageKey : 65786165678908765456789567890678
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid MessageKey"
        )
    })

    it (`throws w/ invalid TransferRate`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            TransferRate : "1000000001"
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid TransferRate"
        )
    })

    it (`throws w/ invalid TickSize`, () => {
        const offer = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            TickSize : 20
        } as any

        assert.throws(
            () => verifyAccountSet(offer),
            ValidationError,
            "AccountSet: invalid TickSize"
        )
    })

})