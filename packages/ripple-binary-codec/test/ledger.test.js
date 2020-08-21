const { loadFixture } = require("./utils");
const {
  transactionTreeHash,
  ledgerHash,
  accountStateHash,
} = require("../dist/ledger-hashes");

describe("Ledger Hashes", function () {
  function testFactory(ledgerFixture) {
    describe(`can calculate hashes for ${ledgerFixture}`, function () {
      const ledger = loadFixture(ledgerFixture);
      test("computes correct account state hash", function () {
        expect(accountStateHash(ledger.accountState).toHex()).toBe(
          ledger.account_hash
        );
      });
      test("computes correct transaction tree hash", function () {
        expect(transactionTreeHash(ledger.transactions).toHex()).toBe(
          ledger.transaction_hash
        );
      });
      test("computes correct ledger header hash", function () {
        expect(ledgerHash(ledger).toHex()).toBe(ledger.hash);
      });
    });
  }
  testFactory("ledger-full-40000.json");
  testFactory("ledger-full-38129.json");
});
