import { ValidationError } from 'xrpl-local/common/errors'
import { verifyAccountSet } from './../../src/models/transactions/accountSet'
import { assert } from 'chai'

/**
 * AccountSet Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('AccountSet Transaction Verification', function () {

    let account 

    beforeEach(() => {
        account = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : "6578616D706C652E636F6D",
            SetFlag : 5,
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any
    })

    it (`verifies valid AccountSet`, () => {
        assert.doesNotThrow(() => verifyAccountSet(account))
    })

    it (`throws w/ invalid SetFlag (out of range)`, () => {
        account.SetFlag = 12

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid SetFlag"
        )
    })

    it (`throws w/ invalid SetFlag (incorrect type)`, () => {
        account.SetFlag = 'abc'
        
        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid SetFlag"
        )
    })

    it (`throws w/ invalid ClearFlag`, () => {
        account.ClearFlag = 12

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid ClearFlag"
        )
    })

    it (`throws w/ invalid Domain`, () => {
        account.Domain = 6578616

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid Domain"
        )
    })

    it (`throws w/ invalid EmailHash`, () => {
        account.EmailHash = 657861645678909876543456789876543

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid EmailHash"
        )
    })

    it (`throws w/ invalid MessageKey`, () => {
        account.MessageKey = 65786165678908765456789567890678

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid MessageKey"
        )
    })

    it (`throws w/ invalid TransferRate`, () => {
        account.TransferRate = "1000000001"

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid TransferRate"
        )
    })

    it (`throws w/ invalid TickSize`, () => {
        account.TickSize = 20

        assert.throws(
            () => verifyAccountSet(account),
            ValidationError,
            "AccountSet: invalid TickSize"
        )
    })

})