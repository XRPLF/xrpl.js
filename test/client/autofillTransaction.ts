import { assert } from "chai";

import rippled from "../fixtures/rippled";
import { PaymentTransaction, Transaction } from "../../src/models/transactions";
import { TestSuite } from "../testUtils";

const Fee = "10";
const Sequence = 1432;
const LastLedgerSequence = 2908734;

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'autofillTransaction - should not autofill if fields are present': async (
    client,
    address
  ) => {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee,
      Sequence,
      LastLedgerSequence,
    };
    const txResult = await client.autofillTransaction(tx);

    assert.strictEqual(txResult.Fee, Fee);
    assert.strictEqual(txResult.Sequence, Sequence);
    assert.strictEqual(txResult.LastLedgerSequence, LastLedgerSequence);
  },

  'autofillTransaction - converts Account & Destination X-address to their classic address': async (
    client,
    address,
    mockRippled
  ) => {
    const tx: PaymentTransaction = {
      TransactionType: 'Payment',
      Account: 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
      Amount: '1234',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
    };
    mockRippled.addResponse('account_info', rippled.account_info.normal);
    mockRippled.addResponse('server_info', rippled.server_info.normal);
    mockRippled.addResponse('ledger', rippled.ledger.normal);

    const txResult = await client.autofillTransaction(tx);

    assert.strictEqual(txResult.Account, 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf');
    assert.strictEqual((txResult as PaymentTransaction).Destination, 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59');
  },

  "autofillTransaction - should autofill Sequence when it's missing": async (
    client,
    address,
    mockRippled
  ) => {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee,
      LastLedgerSequence,
    };
    mockRippled.addResponse('account_info', {
      status: 'success',
      type: 'response',
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    });
    const txResult = await client.autofillTransaction(tx);

    assert.strictEqual(txResult.Sequence, 23);
  },

  "autofillTransaction - should autofill Fee when it's missing": async (
    client,
    address,
    mockRippled
  ) => {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Sequence,
      LastLedgerSequence,
    };
    mockRippled.addResponse('server_info', {
      status: 'success',
      type: 'response',
      result: {
        info: {
          validated_ledger: {
            base_fee_xrp: 0.00001,
          },
        },
      },
    });
    const txResult = await client.autofillTransaction(tx);

    assert.strictEqual(txResult.Fee, '1');
  },

  "autofillTransaction - should autofill LastLedgerSequence when it's missing":
    async (client, address, mockRippled) => {
      const tx: Transaction = {
        TransactionType: 'DepositPreauth',
        Account: address,
        Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        Fee,
        Sequence,
      };
      mockRippled.addResponse('ledger', {
        status: 'success',
        type: 'response',
        result: {
          ledger_index: 9038214,
        },
      });
      const txResult = await client.autofillTransaction(tx);

      assert.strictEqual(txResult.LastLedgerSequence, 9038234);
    },
};
