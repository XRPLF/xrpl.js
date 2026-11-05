import { assert } from 'chai'

import { ValidationError } from '../../src'
import { validateBaseTransaction } from '../../src/models/transactions/common'

const assertValid = (tx: any): void =>
  assert.doesNotThrow(() => validateBaseTransaction(tx))
const assertInvalid = (tx: any, message: string): void =>
  assert.throws(() => validateBaseTransaction(tx), ValidationError, message)

/**
 * Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('BaseTransaction', function () {
  it(`Verifies all optional BaseTransaction`, function () {
    const txJson: any = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Fee: '12',
      Sequence: 100,
      AccountTxnID: 'DEADBEEF',
      Flags: 15,
      LastLedgerSequence: 1383,
      Memos: [
        {
          Memo: {
            MemoType:
              '687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963',
            MemoData: '72656e74',
          },
        },
        {
          Memo: {
            MemoFormat:
              '687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963',
            MemoData: '72656e74',
          },
        },
        {
          Memo: {
            MemoType: '72656e74',
          },
        },
      ],
      Signers: [
        {
          Signer: {
            Account: 'r....',
            TxnSignature: 'DEADBEEF',
            SigningPubKey: 'hex-string',
          },
        },
      ],
      SourceTag: 31,
      SigningPublicKey:
        '03680DD274EE55594F7244F489CD38CF3A5A1A4657122FB8143E185B2BA043DF36',
      TicketSequence: 10,
      TxnSignature:
        '3045022100C6708538AE5A697895937C758E99A595B57A16393F370F11B8D4C032E80B532002207776A8E85BB9FAF460A92113B9C60F170CD964196B1F084E0DAB65BAEC368B66',
    }

    assertValid(txJson)
  })

  it(`Verifies only required BaseTransaction`, function () {
    const txJson = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
    }

    assertValid(txJson)
  })

  it(`Handles invalid Fee`, function () {
    const invalidFee = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Fee: 1000,
    } as any

    assertInvalid(invalidFee, 'Payment: invalid field Fee')
  })

  it(`Handles invalid Sequence`, function () {
    const invalidSeq = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sequence: '145',
    } as any

    assertInvalid(invalidSeq, 'Payment: invalid field Sequence')
  })

  it(`Handles invalid AccountTxnID`, function () {
    const invalidID = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      AccountTxnID: ['WRONG'],
    } as any

    assertInvalid(invalidID, 'Payment: invalid field AccountTxnID')
  })

  it(`Handles invalid LastLedgerSequence`, function () {
    const invalidLastLedgerSequence = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      LastLedgerSequence: '1000',
    } as any

    assertInvalid(
      invalidLastLedgerSequence,
      'Payment: invalid field LastLedgerSequence',
    )
  })

  it(`Handles invalid SourceTag`, function () {
    const invalidSourceTag = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      SourceTag: ['ARRAY'],
    } as any

    assertInvalid(invalidSourceTag, 'Payment: invalid field SourceTag')
  })

  it(`Handles invalid SigningPubKey`, function () {
    const invalidSigningPubKey = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      SigningPubKey: 1000,
    } as any

    assertInvalid(invalidSigningPubKey, 'Payment: invalid field SigningPubKey')
  })

  it(`Handles invalid TicketSequence`, function () {
    const invalidTicketSequence = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      TicketSequence: '1000',
    } as any

    assertInvalid(
      invalidTicketSequence,
      'Payment: invalid field TicketSequence',
    )
  })

  it(`Handles invalid TxnSignature`, function () {
    const invalidTxnSignature = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      TxnSignature: 1000,
    } as any

    assertInvalid(invalidTxnSignature, 'Payment: invalid field TxnSignature')
  })

  it(`Handles invalid Signers`, function () {
    const invalidSigners = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Signers: [],
    } as any

    assertInvalid(invalidSigners, 'BaseTransaction: invalid Signers')

    const invalidSigners2 = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Signers: [
        {
          Signer: {
            Account: 'r....',
          },
        },
      ],
    } as any

    assertInvalid(invalidSigners2, 'BaseTransaction: invalid Signers')
  })

  it(`Handles invalid Memo`, function () {
    const invalidMemo = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Memos: [
        {
          Memo: {
            MemoData: 'HI',
            Address: 'WRONG',
          },
        },
      ],
    } as any

    assertInvalid(invalidMemo, 'BaseTransaction: invalid Memos')
  })

  it(`Handles invalid NetworkID`, function () {
    const invalidNetworkID = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      NetworkID: '1024',
    }
    assertInvalid(invalidNetworkID, 'Payment: invalid field NetworkID')
  })

  it(`Handles invalid Delegate`, function () {
    const invalidDelegate = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Delegate: 1234,
    }
    assertInvalid(invalidDelegate, 'Payment: invalid field Delegate')
  })

  it(`Handles Account and Delegate being the same error`, function () {
    const account = 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe'
    const invalidDelegate = {
      Account: account,
      TransactionType: 'Payment',
      Delegate: account,
    }
    assertInvalid(
      invalidDelegate,
      'BaseTransaction: Account and Delegate addresses cannot be the same',
    )
  })

  it(`Allows spfSponsorReserve on a rippled-allow-listed transaction type`, function () {
    const validReserveSponsorship = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      // spfSponsorReserve
      SponsorFlags: 0x00000002,
    }
    assertValid(validReserveSponsorship)
  })

  it(`Rejects spfSponsorReserve on a transaction type not on rippled's allow-list`, function () {
    const invalidReserveSponsorship = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'OfferCreate',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      // spfSponsorReserve
      SponsorFlags: 0x00000002,
    }
    assertInvalid(
      invalidReserveSponsorship,
      'Transaction: OfferCreate cannot use spfSponsorReserve flag',
    )
  })

  it(`Rejects spfSponsorReserve combined with Delegate`, function () {
    const invalidReserveSponsorshipWithDelegate = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Delegate: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorReserve
      SponsorFlags: 0x00000002,
    }
    assertInvalid(
      invalidReserveSponsorshipWithDelegate,
      'Transaction: SponsorFlags.spfSponsorReserve cannot be combined with Delegate',
    )
  })

  it(`Allows spfSponsorFee combined with Delegate`, function () {
    const validFeeSponsorshipWithDelegate = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Delegate: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorFee
      SponsorFlags: 0x00000001,
    }
    assertValid(validFeeSponsorshipWithDelegate)
  })

  it(`Rejects spfSponsorFee on an inner Batch transaction`, function () {
    const invalidFeeSponsorshipOnInnerBatchTxn = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorFee
      SponsorFlags: 0x00000001,
      // tfInnerBatchTxn
      Flags: 0x40000000,
    }
    assertInvalid(
      invalidFeeSponsorshipOnInnerBatchTxn,
      'Transaction: SponsorFlags.spfSponsorFee is not allowed on inner Batch transactions',
    )
  })

  it(`Rejects spfSponsorFee on an inner Batch transaction (Flags as object)`, function () {
    const invalidFeeSponsorshipOnInnerBatchTxn = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorFee
      SponsorFlags: 0x00000001,
      Flags: { tfInnerBatchTxn: true },
    }
    assertInvalid(
      invalidFeeSponsorshipOnInnerBatchTxn,
      'Transaction: SponsorFlags.spfSponsorFee is not allowed on inner Batch transactions',
    )
  })

  it(`Allows spfSponsorReserve on an inner Batch transaction`, function () {
    const validReserveSponsorshipOnInnerBatchTxn = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorReserve
      SponsorFlags: 0x00000002,
      // tfInnerBatchTxn
      Flags: 0x40000000,
    }
    assertValid(validReserveSponsorshipOnInnerBatchTxn)
  })

  it(`Allows the empty placeholder SponsorSignature on an inner Batch transaction`, function () {
    const validSponsorSignatureOnInnerBatchTxn = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorReserve
      SponsorFlags: 0x00000002,
      // tfInnerBatchTxn
      Flags: 0x40000000,
      SponsorSignature: {
        SigningPubKey: '',
      },
    }
    assertValid(validSponsorSignatureOnInnerBatchTxn)
  })

  it(`Rejects a fully-signed SponsorSignature on an inner Batch transaction`, function () {
    const invalidSponsorSignatureOnInnerBatchTxn = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
      // spfSponsorReserve
      SponsorFlags: 0x00000002,
      // tfInnerBatchTxn
      Flags: 0x40000000,
      SponsorSignature: {
        SigningPubKey: 'hex-string',
        TxnSignature: 'DEADBEEF',
      },
    }
    assertInvalid(
      invalidSponsorSignatureOnInnerBatchTxn,
      'Transaction: invalid SponsorSignature',
    )
  })

  describe('PasskeySignature', function () {
    const p256Key = `F6${'AB'.repeat(64)}`
    const passkeySignature = {
      PasskeyID: 'A1B2',
      AuthenticatorData: '49960DE5880E8C68',
      ClientDataJSON: '7B7D',
      Signature: '3006020101020101',
    }
    const passkeyTx = (): Record<string, unknown> => ({
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      SigningPubKey: p256Key,
      PasskeySignature: { ...passkeySignature },
    })

    it(`Verifies a PasskeySignature with a P-256 SigningPubKey`, function () {
      assertValid(passkeyTx())
    })

    it(`Handles a PasskeySignature that is not an object`, function () {
      assertInvalid(
        { ...passkeyTx(), PasskeySignature: 'AB' },
        'BaseTransaction: invalid PasskeySignature',
      )
    })

    Object.keys(passkeySignature).forEach((field) => {
      it(`Handles a PasskeySignature without ${field}`, function () {
        const partial = Object.fromEntries(
          Object.entries(passkeySignature).filter(([key]) => key !== field),
        )
        assertInvalid(
          { ...passkeyTx(), PasskeySignature: partial },
          'BaseTransaction: invalid PasskeySignature',
        )
      })

      it(`Handles a PasskeySignature with a non-hex ${field}`, function () {
        const tx = passkeyTx()
        ;(tx.PasskeySignature as Record<string, unknown>)[field] = 'xyz'
        assertInvalid(tx, 'BaseTransaction: invalid PasskeySignature')
      })
    })

    it(`Handles a PasskeySignature without a P-256 SigningPubKey`, function () {
      assertInvalid(
        {
          ...passkeyTx(),
          SigningPubKey:
            '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB',
        },
        'BaseTransaction: PasskeySignature requires a P-256 SigningPubKey',
      )
      const tx = passkeyTx()
      delete tx.SigningPubKey
      assertInvalid(
        tx,
        'BaseTransaction: PasskeySignature requires a P-256 SigningPubKey',
      )
    })

    // xrpld's Signer template is Account, SigningPubKey and TxnSignature
    // (InnerObjectFormats.cpp:21-27), and STObject::applyTemplate refuses any
    // other field (STObject.cpp:193-199): a P-256 multi-signer signs with
    // TxnSignature, never a PasskeySignature.
    it(`Handles a PasskeySignature inside a Signers entry`, function () {
      assertInvalid(
        {
          Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
          TransactionType: 'Payment',
          SigningPubKey: '',
          Signers: [
            {
              Signer: {
                Account: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
                SigningPubKey: p256Key,
                TxnSignature: '3006020101020101',
                PasskeySignature: { ...passkeySignature },
              },
            },
          ],
        },
        'BaseTransaction: invalid Signers',
      )
    })

    it(`Verifies a P-256 key signing a Signers entry with TxnSignature`, function () {
      assertValid({
        Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
        TransactionType: 'Payment',
        SigningPubKey: '',
        Signers: [
          {
            Signer: {
              Account: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
              SigningPubKey: p256Key,
              TxnSignature: '3006020101020101',
            },
          },
        ],
      })
    })

    // xrpld's SponsorSignature template is SigningPubKey, TxnSignature and
    // Signers (InnerObjectFormats.cpp:132-138); any other field is refused
    // (STObject.cpp:193-199).
    it(`Handles a PasskeySignature inside SponsorSignature`, function () {
      assertInvalid(
        {
          Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
          TransactionType: 'Payment',
          Sponsor: 'rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1',
          SponsorFlags: 0x00000001,
          SponsorSignature: {
            SigningPubKey: p256Key,
            TxnSignature: '3006020101020101',
            PasskeySignature: { ...passkeySignature },
          },
        },
        'Transaction: invalid SponsorSignature',
      )
    })

    it(`Handles a PasskeySignature beside a TxnSignature`, function () {
      assertInvalid(
        { ...passkeyTx(), TxnSignature: '3006020101020101' },
        'BaseTransaction: PasskeySignature and TxnSignature cannot both be present',
      )
    })
  })
})
