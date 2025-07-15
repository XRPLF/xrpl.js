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
})
