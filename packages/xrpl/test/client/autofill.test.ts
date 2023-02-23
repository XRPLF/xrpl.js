import { assert } from 'chai'

import {
  XrplError,
  AccountDelete,
  EscrowFinish,
  Payment,
  Transaction,
} from '../../src'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { assertRejects } from '../testUtils'

const Fee = '10'
const Sequence = 1432
const LastLedgerSequence = 2908734

describe('client.autofill', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('should not autofill if fields are present', async function () {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee,
      Sequence,
      LastLedgerSequence,
    }
    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.Fee, Fee)
    assert.strictEqual(txResult.Sequence, Sequence)
    assert.strictEqual(txResult.LastLedgerSequence, LastLedgerSequence)
  })

  it('converts Account & Destination X-address to their classic address', async function () {
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
      Amount: '1234',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
    }
    testContext.mockRippled!.addResponse(
      'account_info',
      rippled.account_info.normal,
    )
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.normal,
    )
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)

    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.Account, 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf')
    assert.strictEqual(
      txResult.Destination,
      'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    )
  })

  it("should autofill Sequence when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee,
      LastLedgerSequence,
    }
    testContext.mockRippled!.addResponse('account_info', {
      status: 'success',
      type: 'response',
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    })
    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.Sequence, 23)
  })

  it('should throw error if account deletion blockers exist', async function () {
    testContext.mockRippled!.addResponse(
      'account_info',
      rippled.account_info.normal,
    )
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.normal,
    )
    testContext.mockRippled!.addResponse(
      'account_objects',
      rippled.account_objects.normal,
    )

    const tx: AccountDelete = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'AccountDelete',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
      Fee,
      Sequence,
      LastLedgerSequence,
    }

    await assertRejects(testContext.client.autofill(tx), XrplError)
  })

  describe('when autofill Fee is missing', function () {
    it('should autofill Fee of a Transaction', async function () {
      const tx: Transaction = {
        TransactionType: 'DepositPreauth',
        Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
        Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        Sequence,
        LastLedgerSequence,
      }
      testContext.mockRippled!.addResponse(
        'server_info',
        rippled.server_info.normal,
      )
      const txResult = await testContext.client.autofill(tx)

      assert.strictEqual(txResult.Fee, '12')
    })

    it('should autofill Fee of an EscrowFinish transaction', async function () {
      const tx: EscrowFinish = {
        Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
        TransactionType: 'EscrowFinish',
        Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
        OfferSequence: 7,
        Condition:
          'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
        Fulfillment: 'A0028000',
      }
      testContext.mockRippled!.addResponse(
        'account_info',
        rippled.account_info.normal,
      )
      testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
      testContext.mockRippled!.addResponse(
        'server_info',
        rippled.server_info.normal,
      )

      const txResult = await testContext.client.autofill(tx)
      assert.strictEqual(txResult.Fee, '399')
    })

    it('should autofill Fee of an AccountDelete transaction', async function () {
      const tx: AccountDelete = {
        Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
        TransactionType: 'AccountDelete',
        Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
      }
      testContext.mockRippled!.addResponse(
        'account_info',
        rippled.account_info.normal,
      )
      testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
      testContext.mockRippled!.addResponse('server_state', {
        status: 'success',
        type: 'response',
        result: {
          state: {
            validated_ledger: {
              reserve_inc: 2000000,
            },
          },
        },
      })
      testContext.mockRippled!.addResponse(
        'server_info',
        rippled.server_info.normal,
      )
      testContext.mockRippled!.addResponse(
        'account_objects',
        rippled.account_objects.empty,
      )
      const txResult = await testContext.client.autofill(tx)

      assert.strictEqual(txResult.Fee, '2000000')
    })

    it('should autofill Fee of an EscrowFinish transaction with signersCount', async function () {
      const tx: EscrowFinish = {
        Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
        TransactionType: 'EscrowFinish',
        Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
        OfferSequence: 7,
        Condition:
          'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
        Fulfillment: 'A0028000',
      }
      testContext.mockRippled!.addResponse(
        'account_info',
        rippled.account_info.normal,
      )
      testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
      testContext.mockRippled!.addResponse(
        'server_info',
        rippled.server_info.normal,
      )
      const txResult = await testContext.client.autofill(tx, 4)

      assert.strictEqual(txResult.Fee, '459')
    })
  })

  it("should autofill LastLedgerSequence when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee,
      Sequence,
    }
    testContext.mockRippled!.addResponse('ledger', {
      status: 'success',
      type: 'response',
      result: {
        ledger_index: 9038214,
      },
    })
    const txResult = await testContext.client.autofill(tx)
    assert.strictEqual(txResult.LastLedgerSequence, 9038234)
  })

  it('should autofill fields when all are missing', async function () {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
    }
    testContext.mockRippled!.addResponse('account_info', {
      status: 'success',
      type: 'response',
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    })
    testContext.mockRippled!.addResponse('ledger', {
      status: 'success',
      type: 'response',
      result: {
        ledger_index: 9038214,
      },
    })
    testContext.mockRippled!.addResponse('server_info', {
      status: 'success',
      type: 'response',
      result: {
        info: {
          validated_ledger: {
            base_fee_xrp: 0.00001,
          },
        },
      },
    })
    const txResult = await testContext.client.autofill(tx)
    assert.strictEqual(txResult.Fee, '12')
    assert.strictEqual(txResult.Sequence, 23)
    assert.strictEqual(txResult.LastLedgerSequence, 9038234)
  })
})
