import { assert } from "chai";

import { ValidationError } from "xrpl-local/common/errors";

import { verifyBaseTransaction } from "../../src/models/transactions/common";

/**
 * Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe("Transaction Verification", function () {
  it(`Verifies all optional BaseTransaction`, function () {
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
            MemoType:
              "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
            MemoData: "72656e74",
          },
        },
        {
          Memo: {
            MemoFormat:
              "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
            MemoData: "72656e74",
          },
        },
        {
          Memo: {
            MemoType: "72656e74",
          },
        },
      ],
      Signers: [
        {
          Account: "r....",
          TxnSignature: "DEADBEEF",
          SigningPubKey: "hex-string",
        },
      ],
      SourceTag: 31,
      SigningPublicKey:
        "03680DD274EE55594F7244F489CD38CF3A5A1A4657122FB8143E185B2BA043DF36",
      TicketSequence: 10,
      TxnSignature:
        "3045022100C6708538AE5A697895937C758E99A595B57A16393F370F11B8D4C032E80B532002207776A8E85BB9FAF460A92113B9C60F170CD964196B1F084E0DAB65BAEC368B66",
    };

    assert.doesNotThrow(() => verifyBaseTransaction(txJson));
  });

  it(`Verifies only required BaseTransaction`, function () {
    const txJson = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
    };

    assert.doesNotThrow(() => verifyBaseTransaction(txJson));
  });

  it(`Handles invalid Fee`, function () {
    const invalidFee = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      Fee: 1000,
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidFee),
      ValidationError,
      "BaseTransaction: invalid Fee"
    );
  });

  it(`Handles invalid Sequence`, function () {
    const invalidSeq = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      Sequence: "145",
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidSeq),
      ValidationError,
      "BaseTransaction: invalid Sequence"
    );
  });

  it(`Handles invalid AccountTxnID`, function () {
    const invalidID = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      AccountTxnID: ["WRONG"],
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidID),
      ValidationError,
      "BaseTransaction: invalid AccountTxnID"
    );
  });

  it(`Handles invalid LastLedgerSequence`, function () {
    const invalidLastLedgerSequence = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      LastLedgerSequence: "1000",
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidLastLedgerSequence),
      ValidationError,
      "BaseTransaction: invalid LastLedgerSequence"
    );
  });

  it(`Handles invalid SourceTag`, function () {
    const invalidSourceTag = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      SourceTag: ["ARRAY"],
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidSourceTag),
      ValidationError,
      "BaseTransaction: invalid SourceTag"
    );
  });

  it(`Handles invalid SigningPubKey`, function () {
    const invalidSigningPubKey = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      SigningPubKey: 1000,
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidSigningPubKey),
      ValidationError,
      "BaseTransaction: invalid SigningPubKey"
    );
  });

  it(`Handles invalid TicketSequence`, function () {
    const invalidTicketSequence = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      TicketSequence: "1000",
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidTicketSequence),
      ValidationError,
      "BaseTransaction: invalid TicketSequence"
    );
  });

  it(`Handles invalid TxnSignature`, function () {
    const invalidTxnSignature = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      TxnSignature: 1000,
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidTxnSignature),
      ValidationError,
      "BaseTransaction: invalid TxnSignature"
    );
  });

  it(`Handles invalid Signers`, function () {
    const invalidSigners = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      Signers: [],
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidSigners),
      ValidationError,
      "BaseTransaction: invalid Signers"
    );

    const invalidSigners2 = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      Signers: [
        {
          Account: "r....",
        },
      ],
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidSigners2),
      ValidationError,
      "BaseTransaction: invalid Signers"
    );
  });

  it(`Handles invalid Memo`, function () {
    const invalidMemo = {
      Account: "r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe",
      TransactionType: "Payment",
      Memos: [
        {
          Memo: {
            MemoData: "HI",
            Address: "WRONG",
          },
        },
      ],
    } as any;

    assert.throws(
      () => verifyBaseTransaction(invalidMemo),
      ValidationError,
      "BaseTransaction: invalid Memos"
    );
  });
});
