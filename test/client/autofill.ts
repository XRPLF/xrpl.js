import { assert } from "chai";

import { Payment, Transaction } from "../../src/models/transactions";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";

const Fee = "10";
const Sequence = 1432;
const LastLedgerSequence = 2908734;

describe("client.autofill", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("should not autofill if fields are present", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Fee,
      Sequence,
      LastLedgerSequence,
    };
    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Fee, Fee);
    assert.strictEqual(txResult.Sequence, Sequence);
    assert.strictEqual(txResult.LastLedgerSequence, LastLedgerSequence);
  });

  it("converts Account & Destination X-address to their classic address", async function () {
    const tx: Payment = {
      TransactionType: "Payment",
      Account: "XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi",
      Amount: "1234",
      Destination: "X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ",
    };
    this.mockRippled.addResponse("account_info", rippled.account_info.normal);
    this.mockRippled.addResponse("server_info", rippled.server_info.normal);
    this.mockRippled.addResponse("ledger", rippled.ledger.normal);

    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Account, "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf");
    assert.strictEqual(
      txResult.Destination,
      "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59"
    );
  });

  it("should autofill Sequence when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Fee,
      LastLedgerSequence,
    };
    this.mockRippled.addResponse("account_info", {
      status: "success",
      type: "response",
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    });
    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Sequence, 23);
  });

  it("should autofill Fee when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Sequence,
      LastLedgerSequence,
    };
    this.mockRippled.addResponse("server_info", {
      status: "success",
      type: "response",
      result: {
        info: {
          validated_ledger: {
            base_fee_xrp: 0.00001,
          },
        },
      },
    });
    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Fee, "1");
  });

  it("should autofill LastLedgerSequence when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Fee,
      Sequence,
    };
    this.mockRippled.addResponse("ledger", {
      status: "success",
      type: "response",
      result: {
        ledger_index: 9038214,
      },
    });
    const txResult = await this.client.autofill(tx);
    assert.strictEqual(txResult.LastLedgerSequence, 9038234);
  });
});
