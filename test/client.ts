import { assert } from "chai";
import _ from "lodash";

import { Client } from "xrpl-local";
import {
  RecursiveData,
  renameCounterpartyToIssuerInOrder,
  compareTransactions,
  getRecursive,
} from "xrpl-local/ledger/utils";

import { toRippledAmount } from "../src";

import setupClient from "./setupClient";
import { assertRejects } from "./testUtils";

// how long before each test case times out
const TIMEOUT = 20000;

describe("Client", function () {
  this.timeout(TIMEOUT);
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("Client - implicit server port", function () {
    new Client("wss://s1.ripple.com");
  });

  it("Client invalid options", function () {
    // @ts-expect-error - This is intentionally invalid
    assert.throws(() => new Client({ invalid: true }));
  });

  it("Client valid options", function () {
    const client = new Client("wss://s:1");
    const privateConnectionUrl = (client.connection as any)._url;
    assert.deepEqual(privateConnectionUrl, "wss://s:1");
  });

  it("Client invalid server uri", function () {
    assert.throws(() => new Client("wss//s:1"));
  });

  it("Client connect() times out after 2 seconds", function () {
    // TODO: Use a timer mock like https://jestjs.io/docs/en/timer-mocks
    //       to test that connect() times out after 2 seconds.
  });

  describe("[private] validator", function () {
    it("common utils - toRippledAmount", async function () {
      const amount = { issuer: "is", currency: "c", value: "v" };
      assert.deepEqual(toRippledAmount(amount), {
        issuer: "is",
        currency: "c",
        value: "v",
      });
    });

    it("ledger utils - renameCounterpartyToIssuerInOrder", async function () {
      const order = {
        taker_gets: { counterparty: "1", currency: "XRP" },
        taker_pays: { counterparty: "1", currency: "XRP" },
      };
      const expected = {
        taker_gets: { issuer: "1", currency: "XRP" },
        taker_pays: { issuer: "1", currency: "XRP" },
      };
      assert.deepEqual(renameCounterpartyToIssuerInOrder(order), expected);
    });

    it("ledger utils - compareTransactions", async function () {
      // @ts-expect-error
      assert.strictEqual(compareTransactions({}, {}), 0);
      let first: any = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };
      let second: any = { outcome: { ledgerVersion: 1, indexInLedger: 200 } };
      assert.strictEqual(compareTransactions(first, second), -1);
      first = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };
      second = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };
      assert.strictEqual(compareTransactions(first, second), 0);
      first = { outcome: { ledgerVersion: 1, indexInLedger: 200 } };
      second = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };
      assert.strictEqual(compareTransactions(first, second), 1);
    });

    it("ledger utils - getRecursive", async function () {
      async function getter(marker) {
        return new Promise<RecursiveData>((resolve, reject) => {
          if (marker != null) {
            reject(new Error());
            return;
          }
          resolve({ marker: "A", results: [1] });
        });
      }
      await assertRejects(getRecursive(getter, 10), Error);
    });
  });
});
