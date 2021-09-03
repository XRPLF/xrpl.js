import { assert } from "chai";
import { decode } from "ripple-binary-codec";
import { encode } from "../../ripple-binary-codec/dist";

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

const tx: Transaction = {
  TransactionType: "Payment",
  Account: address,
  Destination: "rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r",
  Amount: "20000000",
  Sequence: 1,
  Fee: "12",
  SigningPubKey: publicKey,
};

const multisignTx1: Transaction = {
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

const multisignTx2: Transaction = {
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
        Account: "rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v",
        TxnSignature:
          "30440220680BBD745004E9CFB6B13A137F505FB92298AD309071D16C7B982825188FD1AE022004200B1F7E4A6A84BB0E4FC09E1E3BA2B66EBD32F0E6D121A34BA3B04AD99BC1",
        SigningPubKey:
          "028FFB276505F9AC3F57E8D5242B386A597EF6C40A7999F37F1948636FD484E25B",
      },
    },
  ],
  SigningPubKey: "",
  TransactionType: "TrustSet",
};

const expectedCombineMultisigned =
  "1200142200040000240000000263D5038D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E868400000000000753073008114A3780F5CB5A44D366520FC44055E8ED44D9A2270F3E010732102B3EC4E5DD96029A647CFA20DA07FE1F85296505552CCAC114087E66B46BD77DF744730450221009C195DBBF7967E223D8626CA19CF02073667F2B22E206727BFE848FF42BEAC8A022048C323B0BED19A988BDBEFA974B6DE8AA9DCAE250AA82BBD1221787032A864E58114204288D2E47F8EF6C99BCC457966320D12409711E1E0107321028FFB276505F9AC3F57E8D5242B386A597EF6C40A7999F37F1948636FD484E25B744630440220680BBD745004E9CFB6B13A137F505FB92298AD309071D16C7B982825188FD1AE022004200B1F7E4A6A84BB0E4FC09E1E3BA2B66EBD32F0E6D121A34BA3B04AD99BC181147908A7F0EDD48EA896C3580A399F0EE78611C8E3E1F1";

describe("Signer tests", function () {
  it("sign transaction offline", function () {
    // Test case data generated using this tutorial - https://xrpl.org/send-xrp.html#send-xrp
    const seed = "ss1x3KLrSvfg7irFc1D929WXZ7z9H";
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

  it("multisign correctly signs a transaction", function () {
    assert.fail("Not implemented yet");
  });

  it("combineMultisigned runs successfully with Transaction objects", function () {
    const transactions: Transaction[] = [multisignTx1, multisignTx2];

    // TODO: Compare this result to something else (Get the results of the existing combine for comparison)
    assert.equal(combineMultisigned(transactions), expectedCombineMultisigned);
  });

  it("combineMultisigned runs successfully with tx_blobs", function () {
    const transactions: Transaction[] = [multisignTx1, multisignTx2];

    const encodedTransactions: string[] = transactions.map(encode);

    // TODO: Compare this result to something else (Get the results of the existing combine for comparison)
    assert.equal(
      combineMultisigned(encodedTransactions),
      expectedCombineMultisigned
    );
  });

  it("throws a validation error if trying to combineMultisigned with no transactions", function () {
    const transactions: Transaction[] = [];
    assert.throws(() => combineMultisigned(transactions), ValidationError);
  });

  it("Going from unsigned transaction to combinedMultisigned workflow succeeds", function () {
    assert.fail("Not implemented yet");
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
