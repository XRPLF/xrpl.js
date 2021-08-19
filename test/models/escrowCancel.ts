import { verifyEscrowCancel } from './../../src/models/transactions/escrowCancel'
import { assert } from 'chai'
import { ValidationError } from '../../src/common/errors'

/**
 * Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Transaction Verification', function () {
    let cancel

    beforeEach(() => {
        cancel = {
            TransactionType: "EscrowCancel",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
        }
    })

    it (`Valid EscrowCancel`, () => {
        assert.doesNotThrow(() => verifyEscrowCancel(cancel))
    })

    it (`Invalid EscrowCancel missing owner`, () => {
       delete cancel.Owner

        assert.throws(
            () => verifyEscrowCancel(cancel),
            ValidationError,
            'EscrowCancel: missing Owner'
        )
    })
    
    it (`Invalid EscrowCancel missing offerSequence`, () => {
        delete cancel.OfferSequence

        assert.throws(
            () => verifyEscrowCancel(cancel),
            ValidationError,
            'EscrowCancel: missing OfferSequence'
        )
    })

    it (`Invalid OfferSequence`, () => {
        cancel.Owner = 10

        assert.throws(
            () => verifyEscrowCancel(cancel),
            ValidationError,
            'EscrowCancel: Owner must be a string'
        )
    })

    it (`Invalid owner`, () => {
       cancel.OfferSequence = "10"

        assert.throws(
            () => verifyEscrowCancel(cancel),
            ValidationError,
            'EscrowCancel: OfferSequence must be a number'
        )
    })
})