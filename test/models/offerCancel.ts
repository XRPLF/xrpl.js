import { ValidationError } from 'xrpl-local/common/errors'
import { verifyOfferCancel } from './../../src/models/transactions/offerCancel'
import { assert } from 'chai'
import { verify } from '../../src/models/transactions'

/**
 * OfferCancel Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('OfferCancel Transaction Verification', function () {
   let offer
   
   beforeEach(() => {
       offer = {
        TransactionType: "OfferCancel",
        Account: "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
        Fee: "12",
        Flags: 0,
        LastLedgerSequence: 7108629,
        OfferSequence: 6,
        Sequence: 7
    } as any
   })

    it (`verifies valid OfferCancel`, () => {        
        assert.doesNotThrow(() => {
            verifyOfferCancel(offer)
            verify(offer)
        })
    })

    it (`verifies valid OfferCancel with flags`, () => {
        offer.Flags = 2147483648
        assert.doesNotThrow(() => {
            verifyOfferCancel(offer)
            verify(offer)
        })
    })

    it (`throws w/ OfferSequence must be a number`, () => {
        offer.OfferSequence = '99'
        assert.throws(
            () => {
                verifyOfferCancel(offer)
                verify(offer)
            },
            ValidationError,
            "OfferCancel: OfferSequence must be a number"
        )
    })

    it (`throws w/ missing OfferSequence`, () => {
        delete offer.OfferSequence
        assert.throws(
            () => {
                verifyOfferCancel(offer)
                verify(offer)
            },
            ValidationError,
            "OfferCancel: missing field OfferSequence"
        )
    })
})