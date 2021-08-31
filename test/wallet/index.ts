import { assert } from "chai";

import ECDSA from "../../src/common/ecdsa";
import Wallet from "../../src/Wallet";

/**
 * Wallet testing.
 *
 * Provides tests for Wallet class.
 */
describe("Wallet", function () {
  describe("fromSeed", function () {
    const seed = "ssL9dv2W5RK8L3tuzQxYY6EaZhSxW";
    const publicKey =
      "030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D";
    const privateKey =
      "00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F";

    it("derives a wallet using default algorithm", function () {
      const wallet = Wallet.fromSeed(seed);

      assert.equal(wallet.publicKey, publicKey);
      assert.equal(wallet.privateKey, privateKey);
    });

    it("derives a wallet using algorithm ecdsa-secp256k1", function () {
      const algorithm = ECDSA.secp256k1;
      const wallet = Wallet.fromSeed(seed, algorithm);

      assert.equal(wallet.publicKey, publicKey);
      assert.equal(wallet.privateKey, privateKey);
    });

    it("derives a wallet using algorithm ed25519", function () {
      const algorithm = ECDSA.ed25519;
      const wallet = Wallet.fromSeed(seed, algorithm);

      assert.equal(wallet.publicKey, publicKey);
      assert.equal(wallet.privateKey, privateKey);
    });
  });

  describe("fromMnemonic", function () {
    const mnemonic =
      "try milk link drift aware pass obtain again music stick pluck fold";
    const publicKey =
      "0257B550BA2FDCCF0ADDA3DEB2A5411700F3ADFDCC7C68E1DCD1E2B63E6B0C63E6";
    const privateKey =
      "008F942B6E229C0E9CEE47E7A94253DABB6A9855F4BA2D8A741FA31851A1D423C3";

    it("derives a wallet using default derivation path", function () {
      const wallet = Wallet.fromMnemonic(mnemonic);

      assert.equal(wallet.publicKey, publicKey);
      assert.equal(wallet.privateKey, privateKey);
    });

    it("derives a wallet using an input derivation path", function () {
      const derivationPath = "m/44'/144'/0'/0/0";
      const wallet = Wallet.fromMnemonic(mnemonic, derivationPath);

      assert.equal(wallet.publicKey, publicKey);
      assert.equal(wallet.privateKey, privateKey);
    });
  });

  describe("fromEntropy", function () {
    const entropy: number[] = new Array(16).fill(0);
    const publicKey =
      "0390A196799EE412284A5D80BF78C3E84CBB80E1437A0AECD9ADF94D7FEAAFA284";
    const privateKey =
      "002512BBDFDBB77510883B7DCCBEF270B86DEAC8B64AC762873D75A1BEE6298665";
    const publicKeyED25519 =
      "ED1A7C082846CFF58FF9A892BA4BA2593151CCF1DBA59F37714CC9ED39824AF85F";
    const privateKeyED25519 =
      "ED0B6CBAC838DFE7F47EA1BD0DF00EC282FDF45510C92161072CCFB84035390C4D";

    it("derives a wallet using entropy", function () {
      const wallet = Wallet.fromEntropy(entropy);

      assert.equal(wallet.publicKey, publicKeyED25519);
      assert.equal(wallet.privateKey, privateKeyED25519);
    });

    it("derives a wallet using algorithm ecdsa-secp256k1", function () {
      const algorithm = ECDSA.secp256k1;
      const wallet = Wallet.fromEntropy(entropy, algorithm);

      assert.equal(wallet.publicKey, publicKey);
      assert.equal(wallet.privateKey, privateKey);
    });

    it("derives a wallet using algorithm ed25519", function () {
      const algorithm = ECDSA.ed25519;
      const wallet = Wallet.fromEntropy(entropy, algorithm);

      assert.equal(wallet.publicKey, publicKeyED25519);
      assert.equal(wallet.privateKey, privateKeyED25519);
    });
  });

  describe("signTransaction", function () {
    const publicKey =
      "030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D";
    const privateKey =
      "00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F";
    const address = "rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc";

    it("signs a transaction offline", function () {
      const txJSON = {
        TransactionType: "Payment",
        Account: address,
        Destination: "rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r",
        Amount: "20000000",
        Sequence: 1,
        Fee: "12",
        SigningPubKey: publicKey,
      };
      const wallet = new Wallet(publicKey, privateKey);
      const signedTx: { signedTransaction: string; id: string } =
        wallet.signTransaction(txJSON);

      assert.hasAllKeys(signedTx, ["id", "signedTransaction"]);
      assert.isString(signedTx.id);
      assert.isString(signedTx.signedTransaction);
    });
  });

  describe("verifyTransaction", function () {
    const publicKey =
      "030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D";
    const privateKey =
      "00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F";
    const prepared = {
      signedTransaction:
        "1200002400000001614000000001312D0068400000000000000C7321030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D74473045022100CAF99A63B241F5F62B456C68A593D2835397101533BB5D0C4DC17362AC22046F022016A2CA2CF56E777B10E43B56541A4C2FB553E7E298CDD39F7A8A844DA491E51D81142AF1861DEC1316AEEC995C94FF9E2165B1B784608314FDB08D07AAA0EB711793A3027304D688E10C3648",
      id: "30D9ECA2A7FB568C5A8607E5850D9567572A9E7C6094C26BEFD4DC4C2CF2657A",
    };

    it("returns true when verifying a transaction signed by the same wallet", function () {
      const wallet = new Wallet(publicKey, privateKey);
      const isVerified: boolean = wallet.verifyTransaction(
        prepared.signedTransaction
      );

      assert.equal(isVerified, true);
    });

    it("returns false when verifying a transaction signed by a different wallet", function () {
      const diffPublicKey =
        "02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8";
      const diffPrivateKey =
        "00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A";
      const wallet = new Wallet(diffPublicKey, diffPrivateKey);
      const isVerified: boolean = wallet.verifyTransaction(
        prepared.signedTransaction
      );

      assert.equal(isVerified, false);
    });
  });

  describe("getXAddress", function () {
    const publicKey =
      "030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D";
    const privateKey =
      "00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F";
    const wallet = new Wallet(publicKey, privateKey);
    const tag = 1337;
    const mainnetXAddress = "X7gJ5YK8abHf2eTPWPFHAAot8Knck11QGqmQ7a6a3Z8PJvk";
    const testnetXAddress = "T7bq3e7kxYq9pwDz8UZhqAZoEkcRGTXSNr5immvcj3DYRaV";

    it("returns a Testnet X-address when test is true", function () {
      const result = wallet.getXAddress(tag, true);
      assert.equal(result, testnetXAddress);
    });

    it("returns a Mainnet X-address when test is false", function () {
      const result = wallet.getXAddress(tag, false);
      assert.equal(result, mainnetXAddress);
    });

    it("returns a Mainnet X-address when test isn't provided", function () {
      const result = wallet.getXAddress(tag);
      assert.equal(result, mainnetXAddress);
    });
  });
});
