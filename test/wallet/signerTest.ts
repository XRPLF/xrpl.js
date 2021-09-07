import { assert } from "chai";
import { decode } from "ripple-binary-codec";

import { encode } from "../../ripple-binary-codec/dist";
import { JsonObject } from "../../ripple-binary-codec/dist/types/serialized-type";
import { ValidationError } from "../../src/common/errors";
import { Transaction } from "../../src/models/transactions";
import Wallet from "../../src/Wallet";
import {
  verify,
  sign,
  authorizeChannel,
  combineMultisigned,
} from "../../src/wallet/signer";

const publicKey =
  "030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D";
const privateKey =
  "00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F";
const address = "rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc";
const seed = "ss1x3KLrSvfg7irFc1D929WXZ7z9H";

const tx: Transaction = {
  TransactionType: "Payment",
  Account: address,
  Destination: "rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r",
  Amount: "20000000",
  Sequence: 1,
  Fee: "12",
  SigningPubKey: publicKey,
};

const unsignedTx1: Transaction = {
  TransactionType: "TrustSet",
  Account: "rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC",
  Fee: "30000",
  Flags: 262144,
  LimitAmount: {
    currency: "USD",
    issuer: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    value: "100",
  },
  Sequence: 2,
};

const unsignedSecret1 = "spzGHmohX9bAM6gzF4m9FvJmJb1CR";

const multisignTx1: Transaction = {
  TransactionType: "TrustSet",
  Account: "rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC",
  Fee: "30000",
  Flags: 262144,
  LimitAmount: {
    currency: "USD",
    issuer: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    value: "100",
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: "rJvuSQhQR37czfxRou4vNWaM97uEhT4ShE",
        SigningPubKey:
          "02B78EEA571B2633180834CC6E7B4ED84FBF6811D12ECB59410E0C92D13B7726F5",
        TxnSignature:
          "304502210098009CEFA61EE9843BB7FC29B78CFFAACF28352A4A7CF3AAE79EF12D79BA50910220684F116266E5E4519A7A33F7421631EB8494082BE51A8B03FECCB3E59F77154A",
      },
    },
  ],
  SigningPubKey: "",
};

const multisignTxToCombine1: Transaction = {
  Account: "rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC",
  Fee: "30000",
  Flags: 262144,
  LimitAmount: {
    currency: "USD",
    issuer: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    value: "100",
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
        SigningPubKey:
          "02B3EC4E5DD96029A647CFA20DA07FE1F85296505552CCAC114087E66B46BD77DF",
        TxnSignature:
          "30450221009C195DBBF7967E223D8626CA19CF02073667F2B22E206727BFE848FF42BEAC8A022048C323B0BED19A988BDBEFA974B6DE8AA9DCAE250AA82BBD1221787032A864E5",
      },
    },
  ],
  SigningPubKey: "",
  TransactionType: "TrustSet",
};

const multisignTxToCombine2: Transaction = {
  Account: "rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC",
  Fee: "30000",
  Flags: 262144,
  LimitAmount: {
    currency: "USD",
    issuer: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    value: "100",
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: "rJvuSQhQR37czfxRou4vNWaM97uEhT4ShE",
        SigningPubKey:
          "02B78EEA571B2633180834CC6E7B4ED84FBF6811D12ECB59410E0C92D13B7726F5",
        TxnSignature:
          "304502210098009CEFA61EE9843BB7FC29B78CFFAACF28352A4A7CF3AAE79EF12D79BA50910220684F116266E5E4519A7A33F7421631EB8494082BE51A8B03FECCB3E59F77154A",
      },
    },
  ],
  SigningPubKey: "",
  TransactionType: "TrustSet",
};

const expectedCombineMultisigned: Transaction = {
  Account: "rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC",
  Fee: "30000",
  Flags: 262144,
  LimitAmount: {
    currency: "USD",
    issuer: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    value: "100",
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
        SigningPubKey:
          "02B3EC4E5DD96029A647CFA20DA07FE1F85296505552CCAC114087E66B46BD77DF",
        TxnSignature:
          "30450221009C195DBBF7967E223D8626CA19CF02073667F2B22E206727BFE848FF42BEAC8A022048C323B0BED19A988BDBEFA974B6DE8AA9DCAE250AA82BBD1221787032A864E5",
      },
    },
    {
      Signer: {
        Account: "rJvuSQhQR37czfxRou4vNWaM97uEhT4ShE",
        SigningPubKey:
          "02B78EEA571B2633180834CC6E7B4ED84FBF6811D12ECB59410E0C92D13B7726F5",
        TxnSignature:
          "304502210098009CEFA61EE9843BB7FC29B78CFFAACF28352A4A7CF3AAE79EF12D79BA50910220684F116266E5E4519A7A33F7421631EB8494082BE51A8B03FECCB3E59F77154A",
      },
    },
  ],
  SigningPubKey: "",
  TransactionType: "TrustSet",
};

describe("Signer tests", function () {
  it("sign transaction offline", function () {
    // Test case data generated using this tutorial - https://xrpl.org/send-xrp.html#send-xrp
    const tx3: Transaction = {
      TransactionType: "Payment",
      Account: "rHLEki8gPUMnF72JnuALvnAMRhRemzhRke",
      Amount: "22000000",
      Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
      Flags: 2147483648,
      LastLedgerSequence: 20582339,
      Fee: "12",
      Sequence: 20582260,
    };
    const signedTxBlob =
      "120000228000000024013A0F74201B013A0FC36140000000014FB18068400000000000000C732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F544744730450221009ECB5324717E14DD6970126271F05BC2626D2A8FA9F3797555D417F8257C1E6002206BDD74A0F30425F2BA9DB69C90F21B3E27735C190FB4F3A640F066ACBBF06AD98114B3263BD0A9BF9DFDBBBBD07F536355FF477BF0E98314F667B0CA50CC7709A220B0561B85E53A48461FA8";

    const wallet = Wallet.fromSeed(seed);

    const signedTx: string = sign(wallet, tx3);

    assert.equal(signedTx, signedTxBlob);
  });

  it("sign correctly encodes a transaction for multisigning", function () {
    const wallet = Wallet.fromSeed(unsignedSecret1);

    assert.deepEqual(
      decode(sign(wallet, unsignedTx1, true)),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Transaction is equivalent to JsonObject
      multisignTx1 as unknown as JsonObject
    );
  });

  it("combineMultisigned runs successfully with Transaction objects", function () {
    const transactions: Transaction[] = [
      multisignTxToCombine1,
      multisignTxToCombine2,
    ];

    assert.deepEqual(
      combineMultisigned(transactions),
      expectedCombineMultisigned
    );
  });

  it("combineMultisigned runs successfully with tx_blobs", function () {
    const transactions: Transaction[] = [
      multisignTxToCombine1,
      multisignTxToCombine2,
    ];

    const encodedTransactions: string[] = transactions.map(encode);

    assert.deepEqual(
      combineMultisigned(encodedTransactions),
      expectedCombineMultisigned
    );
  });

  it("throws a validation error if trying to combineMultisigned with no transactions", function () {
    const transactions: Transaction[] = [];
    assert.throws(() => combineMultisigned(transactions), ValidationError);
  });

  it("authorizeChannel succeeds", function () {
    const wallet = Wallet.fromSeed("snGHNrPbHrdUcszeuDEigMdC1Lyyd");
    const channelId =
      "5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3";
    const amount = "1000000";

    assert.equal(
      authorizeChannel(wallet, channelId, amount),
      "304402204E7052F33DDAFAAA55C9F5B132A5E50EE95B2CF68C0902F61DFE77299BC893740220353640B951DCD24371C16868B3F91B78D38B6F3FD1E826413CDF891FA8250AAC"
    );
  });

  it("authorizeChannel succeeds with ed25519 seed", function () {
    const wallet = Wallet.fromSeed("sEdSuqBPSQaood2DmNYVkwWTn1oQTj2");
    const channelId =
      "5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3";
    const amount = "1000000";
    assert.equal(
      authorizeChannel(wallet, channelId, amount),
      "7E1C217A3E4B3C107B7A356E665088B4FBA6464C48C58267BEF64975E3375EA338AE22E6714E3F5E734AE33E6B97AAD59058E1E196C1F92346FC1498D0674404"
    );
  });

  it("verify succeeds for valid signed transaction string", function () {
    const wallet = new Wallet(publicKey, privateKey);

    const signedTx: string = sign(wallet, tx);

    assert.isTrue(verify(signedTx));
  });

  it("verify succeeds for valid signed transaction object", function () {
    const wallet = new Wallet(publicKey, privateKey);

    const signedTx: string = sign(wallet, tx);

    assert.isTrue(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Necessary for interfacing with binary-codec
      verify(decode(signedTx) as unknown as Transaction)
    );
  });

  it("verify throws for invalid signing key", function () {
    const wallet = new Wallet(publicKey, privateKey);
    const signedTx: string = sign(wallet, tx);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Necessary for interfacing with binary-codec
    const decodedTx: Transaction = decode(signedTx) as unknown as Transaction;

    // Use a different key for validation
    decodedTx.SigningPubKey =
      "0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020";

    assert.isFalse(verify(decodedTx));
  });
});
