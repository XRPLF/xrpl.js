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

  beforeEach(function () {
    offer = {
      Account: "rB5Ux4Lv2nRx6eeoAAsZmtctnBQ2LiACnk",
      Fee: "12",
      Flags: 2147483648,
      LastLedgerSequence: 65953204,
      OfferSequence: 63822840,
      Sequence: 63822842,
      SigningPubKey:
        "0369C9BC4D18FAE741898828A1F48E53E53F6F3DB3191441CC85A14D4FC140E031",
      TransactionType: "OfferCancel",
      TxnSignature:
        "304402203EC848BD6AB42DC8509285245804B15E1652092CC0B189D369E12E563771D049022046DF40C16EA05DC99D01E553EA2E218FCA1C5B38927889A2BDF064D1F44D60F0",
    } as any;
  });

  it(`verifies valid OfferCancel`, function () {
    assert.doesNotThrow(() => verifyOfferCancel(offer));
    // assert.doesNotThrow(() => verify(offer));
    verify(offer);
  });

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