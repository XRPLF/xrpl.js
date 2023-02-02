import { assert } from 'chai'
import { Transaction } from 'xrpl-local'

import { setupClient, teardownClient } from '../setupClient'

const Fee = '10'
const LastLedgerSequence = 2908734

describe('client.autofillBatch', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('should autofill missing Sequence numbers for single account with multiple transactions', async function () {
    const tx: Transaction = {
      TransactionType: 'Payment',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const tx2: Transaction = {
      TransactionType: 'Payment',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const transactions = [{ transaction: tx }, { transaction: tx2 }]
    this.mockRippled.addResponse('account_info', {
      status: 'success',
      type: 'response',
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    })
    const result = await this.client.autofillBatch(transactions)
    assert.equal(result.length, 2)
    assert.strictEqual(result[0].Sequence, 23)
    assert.strictEqual(result[1].Sequence, 24)
  })

  it('should autofill missing Sequence numbers for single account with multiple transactions without account_info lookup', async function () {
    const tx: Transaction = {
      TransactionType: 'Payment',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: `1000`,
      Fee,
      Sequence: 1432,
      LastLedgerSequence,
    }
    const tx2: Transaction = {
      TransactionType: 'Payment',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const transactions = [{ transaction: tx }, { transaction: tx2 }]
    const result = await this.client.autofillBatch(transactions)
    assert.equal(result.length, 2)
    assert.strictEqual(result[0].Sequence, 1432)
    assert.strictEqual(result[1].Sequence, 1433)
  })

  it('should autofill missing Sequence numbers for multiple accounts with multiple transactions', async function () {
    const account = `rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf`
    const account2 = `rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo`
    const tx: Transaction = {
      TransactionType: 'Payment',
      Account: account,
      Destination: account2,
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const tx2: Transaction = {
      TransactionType: 'Payment',
      Account: account,
      Destination: account2,
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const tx3: Transaction = {
      TransactionType: 'Payment',
      Account: account2,
      Destination: account,
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const tx4: Transaction = {
      TransactionType: 'Payment',
      Account: account2,
      Destination: account,
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const transactions = [
      { transaction: tx },
      { transaction: tx2 },
      { transaction: tx3 },
      { transaction: tx4 },
    ]
    this.mockRippled.addResponse('account_info', {
      status: 'success',
      type: 'response',
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    })
    const result = await this.client.autofillBatch(transactions)
    assert.equal(result.length, 4)
    assert.strictEqual(result[0].Sequence, 23)
    assert.strictEqual(result[1].Sequence, 24)
    assert.strictEqual(result[2].Sequence, 23)
    assert.strictEqual(result[3].Sequence, 24)
  })

  it('should autofill missing Sequence numbers for multiple accounts with multiple transactions without account_info lookup', async function () {
    const account = `rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf`
    const account2 = `rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo`
    const tx: Transaction = {
      TransactionType: 'Payment',
      Account: account,
      Destination: account2,
      Amount: `1000`,
      Fee,
      Sequence: 1432,
      LastLedgerSequence,
    }
    const tx2: Transaction = {
      TransactionType: 'Payment',
      Account: account,
      Destination: account2,
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const tx3: Transaction = {
      TransactionType: 'Payment',
      Account: account2,
      Destination: account,
      Amount: `1000`,
      Fee,
      Sequence: 7839,
      LastLedgerSequence,
    }
    const tx4: Transaction = {
      TransactionType: 'Payment',
      Account: account2,
      Destination: account,
      Amount: `1000`,
      Fee,
      LastLedgerSequence,
    }
    const transactions = [
      { transaction: tx },
      { transaction: tx2 },
      { transaction: tx3 },
      { transaction: tx4 },
    ]
    const result = await this.client.autofillBatch(transactions)
    assert.equal(result.length, 4)
    assert.strictEqual(result[0].Sequence, 1432)
    assert.strictEqual(result[1].Sequence, 1433)
    assert.strictEqual(result[2].Sequence, 7839)
    assert.strictEqual(result[3].Sequence, 7840)
  })
})
