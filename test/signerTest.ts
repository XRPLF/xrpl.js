import { assert } from "chai";
import { sign, authorizeChannel, multisign } from "xrpl-local/ledger/signer";
import { decode } from "../ripple-binary-codec";
import { ValidationError } from "../src/common/errors";
import { SignedTransaction } from "../src/common/types/objects";
import { verify } from "../src/ledger/signer";
import { Transaction } from "../src/models/transactions";
import Wallet from "../src/Wallet";

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

describe("Signer tests", function () {
  it("sign transaction offline", () => {
    const wallet = new Wallet(publicKey, privateKey);

    // WHEN signing a transaction offline
    const signedTx: SignedTransaction = sign(wallet, tx);

    // THEN we get a signedTransaction
    //schemaValidator.schemaValidate('sign', signedTx)
    // TODO: Figure out how we validate the return result of sign
    signedTx;
  });

  it("multisigns successfully", () => {
    const tx1: Transaction = {
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
          Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
          SigningPubKey:
            "02B3EC4E5DD96029A647CFA20DA07FE1F85296505552CCAC114087E66B46BD77DF",
          TxnSignature:
            "30450221009C195DBBF7967E223D8626CA19CF02073667F2B22E206727BFE848FF42BEAC8A022048C323B0BED19A988BDBEFA974B6DE8AA9DCAE250AA82BBD1221787032A864E5",
        },
      ],
      SigningPubKey: "",
      TransactionType: "TrustSet",
    };

    const tx2: Transaction = {
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
          Account: "rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v",
          TxnSignature:
            "30440220680BBD745004E9CFB6B13A137F505FB92298AD309071D16C7B982825188FD1AE022004200B1F7E4A6A84BB0E4FC09E1E3BA2B66EBD32F0E6D121A34BA3B04AD99BC1",
          SigningPubKey:
            "028FFB276505F9AC3F57E8D5242B386A597EF6C40A7999F37F1948636FD484E25B",
        },
      ],
      SigningPubKey: "",
      TransactionType: "TrustSet",
    };

    const transactions: Transaction[] = new Array(tx1, tx2);

    multisign(transactions);
  });

  it("throws a validation error if multisigning with no transactions", () => {
    const transactions: Transaction[] = new Array();
    assert.throws(() => multisign(transactions), ValidationError);
  });

  it("authorizeChannel succeeds", () => {
    const wallet = Wallet.fromSeed("snGHNrPbHrdUcszeuDEigMdC1Lyyd");
    const channelId =
      "5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3";
    const amount = "1000000";

    assert.equal(
      authorizeChannel(wallet, channelId, amount),
      "304402204E7052F33DDAFAAA55C9F5B132A5E50EE95B2CF68C0902F61DFE77299BC893740220353640B951DCD24371C16868B3F91B78D38B6F3FD1E826413CDF891FA8250AAC"
    );
  });

  /*it('authorizeChannel succeeds with ed25519 seed'), () => {
        const wallet = Wallet.fromSeed("sEdnGHNrPbHrdUcszeuDEigMdC1Lyyd")
        const channelId = '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3'
        const amount = '1000000'

        assert.equal(authorizeChannel(wallet, channelId, amount),
        '304402207936D71315E0F2AC349A33F988111A6C6D92CD96347AF42BDB5C34EE61D4EC1F0220684CB495EA93DBF0B5A7EC003A1501BC87B2635AA592E5362D240A43DC1BC801')
    }*/

  it("verify succeeds for valid signed transaction string", () => {
    const wallet = new Wallet(publicKey, privateKey);

    const signedTx: SignedTransaction = sign(wallet, tx);

    assert.isTrue(verify(signedTx.signedTransaction));
  });

  it("verify succeeds for valid signed transaction object"),
    () => {
      const wallet = new Wallet(publicKey, privateKey);

      const signedTx: SignedTransaction = sign(wallet, tx);

      assert.isTrue(
        verify(decode(signedTx.signedTransaction) as unknown as Transaction)
      );
    };

  it("verify throws for invalid signing key", () => {
    const wallet = new Wallet(publicKey, privateKey);
    const signedTx: SignedTransaction = sign(wallet, tx);

    const decodedTx: Transaction = decode(
      signedTx.signedTransaction
    ) as unknown as Transaction;

    // Use a different key for validation
    decodedTx.SigningPubKey =
      "0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020";

    assert.isFalse(verify(decodedTx));
  });
});
