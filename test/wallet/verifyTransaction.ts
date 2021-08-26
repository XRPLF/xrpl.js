import assert from "assert-diff";

import Wallet from "xrpl-local/Wallet";

import { TestSuite } from "../testUtils";

const publicKey =
  "030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D";
const privateKey =
  "00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F";
const prepared = {
  signedTransaction:
    "1200002400000001614000000001312D0068400000000000000C7321030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D74473045022100CAF99A63B241F5F62B456C68A593D2835397101533BB5D0C4DC17362AC22046F022016A2CA2CF56E777B10E43B56541A4C2FB553E7E298CDD39F7A8A844DA491E51D81142AF1861DEC1316AEEC995C94FF9E2165B1B784608314FDB08D07AAA0EB711793A3027304D688E10C3648",
  id: "30D9ECA2A7FB568C5A8607E5850D9567572A9E7C6094C26BEFD4DC4C2CF2657A",
};

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "verify transaction offline when a signed transaction is valid": async (
    api
  ) => {
    // GIVEN a transaction that has been signed by the same wallet
    const wallet = new Wallet(publicKey, privateKey);

    // WHEN verifying a signed transaction
    const isVerified: boolean = wallet.verifyTransaction(
      prepared.signedTransaction
    );

    // THEN we get a valid response
    assert.equal(isVerified, true);
  },

  "verify transaction offline when signed transaction isn't valid": async (
    api
  ) => {
    // GIVEN a transaction that has been signed by a different wallet
    const diffPublicKey =
      "02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8";
    const diffPrivateKey =
      "00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A";
    const wallet = new Wallet(diffPublicKey, diffPrivateKey);

    // WHEN verifying a signed transaction
    const isVerified: boolean = wallet.verifyTransaction(
      prepared.signedTransaction
    );

    // THEN we get an invalid response
    assert.equal(isVerified, false);
  },
};
