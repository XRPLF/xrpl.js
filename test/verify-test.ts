import { ValidationError } from 'ripple-api/common/errors'
import { verifyCommonFields } from './../src/models/transactions/common'
import { verifyOfferCreate } from './../src/models/transactions/offerCreate'
import { verifyAccountSet } from './../src/models/transactions/accountSet'
import { assert } from 'chai'

/**
 * Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Transaction Verification', function () {
    it(`Verifies all optional CommonFields`, () => {
        const txJson = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Fee: "12",
            Sequence: 100,
            AccountTxnID: "DEADBEEF",
            Flags: 15,
            LastLedgerSequence: 1383,
            Memos: [
                {
                    Memo: {
                        MemoType: "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
                        MemoData: "72656e74"
                    }
                },
                {
                    Memo: {
                        MemoFormat: "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
                        MemoData: "72656e74"
                    }
                },
                {
                    Memo: {
                        MemoType: "72656e74"
                    }
                }
            ],
            Signers: [
                {
                    Account: "r....",
                    TxnSignature: "DEADBEEF",
                    SigningPubKey: "hex-string"
                }
            ],
            SourceTag: 31,
            SigningPublicKey: "03680DD274EE55594F7244F489CD38CF3A5A1A4657122FB8143E185B2BA043DF36",
            TicketSequence: 10,
            TxnSignature: "3045022100C6708538AE5A697895937C758E99A595B57A16393F370F11B8D4C032E80B532002207776A8E85BB9FAF460A92113B9C60F170CD964196B1F084E0DAB65BAEC368B66"
        }

        assert.doesNotThrow(() => verifyCommonFields(txJson))
    })

    it(`Verifies only required CommonFields`, () => {
        const txJson = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
        }
        
        assert.doesNotThrow(() => verifyCommonFields(txJson))
    })

    it (`Handles invalid Fee`, () => {
        const invalidFee = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Fee: 1000
        } as any

        assert.throws(
            () => verifyCommonFields(invalidFee),
            ValidationError,
            "CommonFields: invalid Fee"
        )
    })

    it (`Handles invalid Sequence`, () => {
        const invalidSeq = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Sequence: "145"
        } as any

        assert.throws(
            () => verifyCommonFields(invalidSeq),
            ValidationError,
            "CommonFields: invalid Sequence"
        )
    })

    it (`Handles invalid AccountTxnID`, () => {
        const invalidID = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            AccountTxnID: ["WRONG"]
        } as any

        assert.throws(
            () => verifyCommonFields(invalidID),
            ValidationError,
            "CommonFields: invalid AccountTxnID"
        )
    })

    it (`Handles invalid Flags`, () => {
        const invalidFlags = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Flags: "1000"
        } as any


        assert.throws(
            () => verifyCommonFields(invalidFlags),
            ValidationError,
            "CommonFields: invalid Flags"
        )
    })

    it (`Handles invalid LastLedgerSequence`, () => {
        const invalidLastLedgerSequence = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            LastLedgerSequence: "1000"
        } as any

        assert.throws(
            () => verifyCommonFields(invalidLastLedgerSequence),
            ValidationError,
            "CommonFields: invalid LastLedgerSequence"
        )
    })

    it (`Handles invalid SourceTag`, () => {
        const invalidSourceTag = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            SourceTag: ["ARRAY"]
        } as any

        
        assert.throws(
            () => verifyCommonFields(invalidSourceTag),
            ValidationError,
            "CommonFields: invalid SourceTag"
        )
    })

    it (`Handles invalid SigningPubKey`, () => {
        const invalidSigningPubKey = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            SigningPubKey: 1000
        } as any

        assert.throws(
            () => verifyCommonFields(invalidSigningPubKey),
            ValidationError,
            "CommonFields: invalid SigningPubKey"
        )
    })

    it (`Handles invalid TicketSequence`, () => {
        const invalidTicketSequence = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            TicketSequence: "1000"
        } as any

        assert.throws(
            () => verifyCommonFields(invalidTicketSequence),
            ValidationError,
            "CommonFields: invalid TicketSequence"
        )
    })

    it (`Handles invalid TxnSignature`, () => {
        const invalidTxnSignature = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            TxnSignature: 1000
        } as any
        
        assert.throws(
            () => verifyCommonFields(invalidTxnSignature),
            ValidationError,
            "CommonFields: invalid TxnSignature"
        )
    })

    it (`Handles invalid Signers`, () => {
        const invalidSigners = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Signers: []
        } as any

        assert.throws(
            () => verifyCommonFields(invalidSigners),
            ValidationError,
            "CommonFields: invalid Signers"
        )

        const invalidSigners2 = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Signers: [
                {
                    "Account": "r...."
                }
            ]
        } as any

        assert.throws(
            () => verifyCommonFields(invalidSigners2),
            ValidationError,
            "CommonFields: invalid Signers"
        )
    })

    it (`Handles invalid Memo`, () => {
        const invalidMemo = {
            Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
            TransactionType: "Payment",
            Memos: [{
                Memo: {
                    MemoData: "HI",
                    Address: "WRONG"
                }
            }]
        } as any

        assert.throws(
            () => verifyCommonFields(invalidMemo),
            ValidationError,
            "CommonFields: invalid Memos"
        )
    })

    it (`verifies valid OfferCreate`, () => {
        const offer = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            Expiration: 10,
            OfferSequence: 12,
            TakerGets: {
              currency: "DSH",
              issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
              value: "43.11584856965009"
            },
            TakerPays: "12928290425",
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any
        
        assert.doesNotThrow(() => verifyOfferCreate(offer))

        const offer2 = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            TakerGets: "12928290425",
            TakerPays: {
              currency: "DSH",
              issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
              value: "43.11584856965009"
            },
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any

        assert.doesNotThrow(() => verifyOfferCreate(offer2))


        const offer3 = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            TakerGets: {
                currency: "DSH",
                issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
                value: "43.11584856965009"
            },
            TakerPays: {
              currency: "DSH",
              issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
              value: "43.11584856965009"
            },
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any

        assert.doesNotThrow(() => verifyOfferCreate(offer3))
    })

    it (`throws w/ invalid Expiration`, () => {
        const offer = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            Expiration: "11",
            TakerGets: "12928290425",
            TakerPays: {
              currency: "DSH",
              issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
              value: "43.11584856965009"
            },
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any

        assert.throws(
            () => verifyOfferCreate(offer),
            ValidationError,
            "OfferCreate: invalid Expiration"
        )
    })

    it (`throws w/ invalid OfferSequence`, () => {
        const offer = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            OfferSequence: "11",
            TakerGets: "12928290425",
            TakerPays: {
              currency: "DSH",
              issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
              value: "43.11584856965009"
            },
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any

        assert.throws(
            () => verifyOfferCreate(offer),
            ValidationError,
            "OfferCreate: invalid OfferSequence"
        )
    })

    it (`throws w/ invalid TakerPays`, () => {
        const offer = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            OfferSequence: "11",
            TakerGets: "12928290425",
            TakerPays: 10,
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any

        assert.throws(
            () => verifyOfferCreate(offer),
            ValidationError,
            "OfferCreate: invalid TakerPays"
        )
    })

    it (`throws w/ invalid TakerGets`, () => {
        const offer = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            OfferSequence: "11",
            TakerGets: 11,
            TakerPays: {
              currency: "DSH",
              issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
              value: "43.11584856965009"
            },
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any

        assert.throws(
            () => verifyOfferCreate(offer),
            ValidationError,
            "OfferCreate: invalid TakerGets"
        )
    })

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

    it (`throws w/ invalid SetFlag`, () => {
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

    it (`throws w/ invalid SetFlag`, () => {
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