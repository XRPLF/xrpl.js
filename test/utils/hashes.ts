import assert from "assert";
import fs from "fs";

import {
  computeStateTreeHash,
  computeTransactionTreeHash,
  computeAccountRootIndex,
  computeTrustlineHash,
  computeOfferIndex,
  computeSignerListIndex,
  computeEscrowHash,
  computePaymentChannelHash,
} from "../../src/utils/hashes";

/**
 * Expects a corresponding ledger dump in $repo/test/fixtures/rippled folder.
 *
 * @param ledgerIndex
 */
function createLedgerTest(ledgerIndex: number) {
  describe(String(ledgerIndex), function () {
    const path = `${__dirname}/../fixtures/rippled/ledgerFull${ledgerIndex}.json`;

    const ledgerRaw = fs.readFileSync(path, { encoding: "utf8" });
    const ledgerJSON = JSON.parse(ledgerRaw);

    const hasAccounts =
      Array.isArray(ledgerJSON.accountState) &&
      ledgerJSON.accountState.length > 0;

    if (hasAccounts) {
      it(`has account_hash of ${ledgerJSON.account_hash}`, function () {
        assert.equal(
          ledgerJSON.account_hash,
          computeStateTreeHash(ledgerJSON.accountState)
        );
      });
    }
    it(`has transaction_hash of ${ledgerJSON.transaction_hash}`, function () {
      assert.equal(
        ledgerJSON.transaction_hash,
        computeTransactionTreeHash(ledgerJSON.transactions)
      );
    });
  });
}

describe("Ledger", function () {
  // This is the first recorded ledger with a non empty transaction set
  createLedgerTest(38129);
  // Because, why not.
  createLedgerTest(40000);
  // 1311 AffectedNodes, no accounts
  createLedgerTest(7501326);

  describe("calcAccountRootEntryHash", function () {
    it("will calculate the AccountRoot entry hash for rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", function () {
      const account = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
      const expectedEntryHash =
        "2B6AC232AA4C4BE41BF49D2459FA4A0347E1B543A4C92FCEE0821C0201E2E9A8";
      const actualEntryHash = computeAccountRootIndex(account);

      assert.equal(actualEntryHash, expectedEntryHash);
    });
  });

  describe("calcRippleStateEntryHash", function () {
    it("will calculate the RippleState entry hash for rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh and rB5TihdPbKgMrkFqrqUC3yLdE8hhv4BdeY in USD", function () {
      const account1 = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
      const account2 = "rB5TihdPbKgMrkFqrqUC3yLdE8hhv4BdeY";
      const currency = "USD";

      const expectedEntryHash =
        "C683B5BB928F025F1E860D9D69D6C554C2202DE0D45877ADB3077DA4CB9E125C";
      const actualEntryHash1 = computeTrustlineHash(
        account1,
        account2,
        currency
      );
      const actualEntryHash2 = computeTrustlineHash(
        account2,
        account1,
        currency
      );

      assert.equal(actualEntryHash1, expectedEntryHash);
      assert.equal(actualEntryHash2, expectedEntryHash);
    });

    it("will calculate the RippleState entry hash for r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV and rUAMuQTfVhbfqUDuro7zzy4jj4Wq57MPTj in UAM", function () {
      const account1 = "r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV";
      const account2 = "rUAMuQTfVhbfqUDuro7zzy4jj4Wq57MPTj";
      const currency = "UAM";

      const expectedEntryHash =
        "AE9ADDC584358E5847ADFC971834E471436FC3E9DE6EA1773DF49F419DC0F65E";
      const actualEntryHash1 = computeTrustlineHash(
        account1,
        account2,
        currency
      );
      const actualEntryHash2 = computeTrustlineHash(
        account2,
        account1,
        currency
      );

      assert.equal(actualEntryHash1, expectedEntryHash);
      assert.equal(actualEntryHash2, expectedEntryHash);
    });
  });

  describe("calcOfferEntryHash", function () {
    it("will calculate the Offer entry hash for r32UufnaCGL82HubijgJGDmdE5hac7ZvLw, sequence 137", function () {
      const account = "r32UufnaCGL82HubijgJGDmdE5hac7ZvLw";
      const sequence = 137;
      const expectedEntryHash =
        "03F0AED09DEEE74CEF85CD57A0429D6113507CF759C597BABB4ADB752F734CE3";
      const actualEntryHash = computeOfferIndex(account, sequence);

      assert.equal(actualEntryHash, expectedEntryHash);
    });
  });

  describe("computeSignerListIndex", function () {
    it("will calculate the SignerList index for r32UufnaCGL82HubijgJGDmdE5hac7ZvLw", function () {
      const account = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
      const expectedEntryHash =
        "778365D5180F5DF3016817D1F318527AD7410D83F8636CF48C43E8AF72AB49BF";
      const actualEntryHash = computeSignerListIndex(account);
      assert.equal(actualEntryHash, expectedEntryHash);
    });
  });

  describe("calcEscrowEntryHash", function () {
    it("will calculate the Escrow entry hash for rDx69ebzbowuqztksVDmZXjizTd12BVr4x, sequence 84", function () {
      const account = "rDx69ebzbowuqztksVDmZXjizTd12BVr4x";
      const sequence = 84;
      const expectedEntryHash =
        "61E8E8ED53FA2CEBE192B23897071E9A75217BF5A410E9CB5B45AAB7AECA567A";
      const actualEntryHash = computeEscrowHash(account, sequence);

      assert.equal(actualEntryHash, expectedEntryHash);
    });
  });

  describe("calcPaymentChannelEntryHash", function () {
    it("will calculate the PaymentChannel entry hash for rDx69ebzbowuqztksVDmZXjizTd12BVr4x and rLFtVprxUEfsH54eCWKsZrEQzMDsx1wqso, sequence 82", function () {
      const account = "rDx69ebzbowuqztksVDmZXjizTd12BVr4x";
      const dstAccount = "rLFtVprxUEfsH54eCWKsZrEQzMDsx1wqso";
      const sequence = 82;
      const expectedEntryHash =
        "E35708503B3C3143FB522D749AAFCC296E8060F0FB371A9A56FAE0B1ED127366";
      const actualEntryHash = computePaymentChannelHash(
        account,
        dstAccount,
        sequence
      );

      assert.equal(actualEntryHash, expectedEntryHash);
    });
  });
});
