import { ValidationError } from 'xrpl-local/common/errors'
import { verifyOfferCancel } from './../../src/models/transactions/offerCancel'
import { assert } from 'chai'

/**
 * OfferCancel Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('OfferCancel Transaction Verification', function () {
   let offer
   
   beforeEach(() => {
       offer = {
            Account: "rnKiczmiQkZFiDES8THYyLA2pQohC5C6EF",
            Fee: "10",
            LastLedgerSequence: 65477334,
            OfferSequence: 60797528,
            Sequence: 60797535,
            SigningPubKey: "0361BFD43D1EEA54B77CC152887312949EBF052997FBFFCDAF6F2653164B55B21...",
            TransactionType: "OfferCancel",
            TxnSignature: "30450221008C43BDCFC68B4793857CA47DF454C07E5B45D3F80E8E6785CAB9292...",
            date: "2021-08-06T21:04:11Z"
        } as any
   })

    it (`verifies valid OfferCancel`, () => {        
        assert.doesNotThrow(() => verifyOfferCancel(offer))        
    })

    it (`verifies valid OfferCancel with flags`, () => {

        offer.Flags = 2147483648
        assert.doesNotThrow(() => verifyOfferCancel(offer))
        
    })

    it (`throws w/ invalid OfferSequence`, () => {
        offer.OfferSequence = '99'

        assert.throws(
            () => verifyOfferCancel(offer),
            ValidationError,
            "OfferCancel: invalid OfferSequence"
        )
    })

    it (`throws w/ missing OfferSequence`, () => {
        const offer = {
            Account: "rnfQBGzgJb2x26U2Tfe1GaYw4fNB87Dc6J",
            Fee: "12",
            Flags: 2147483648,
            LastLedgerSequence: 65477763,
            Sequence: 219793,
            SigningPubKey: "02775208415B30A20F98C36AAB9A905A7BAC5889CFE7E55D968E7B9D28B93F342...",
            TransactionType: "OfferCancel",
            TxnSignature: "30440220043C67CCDFC513E4D8E9E427AB6E41047B322097EB5E44DE1AE8F58F3...",
            date: "2021-08-06T21:31:12Z",
        } as any

        assert.throws(
            () => verifyOfferCancel(offer),
            ValidationError,
            "OfferCancel: missing field OfferSequence"
        )
    })
})