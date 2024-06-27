import { assert } from 'chai'

import {
  XrplError,
  AccountDelete,
  EscrowFinish,
  Payment,
  Transaction,
} from '../../src'
import { ValidationError } from '../../src/errors'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { assertRejects } from '../testUtils'

const NetworkID = 1025
const Fee = '10'
const Sequence = 1432
const LastLedgerSequence = 2908734

describe('client.autofill', function () {
  let testContext: XrplTestContext
  const AMOUNT = '1234'
  let paymentTx: Payment

  async function setupMockRippledVersionAndID(
    buildVersion: string,
    networkID: number,
  ): Promise<void> {
    await testContext.client.disconnect()
    rippled.server_info.withNetworkId.result.info.build_version = buildVersion
    rippled.server_info.withNetworkId.result.info.network_id = networkID
    testContext.client.connection.on('connected', () => {
      testContext.mockRippled?.addResponse(
        'server_info',
        rippled.server_info.withNetworkId,
      )
    })

    await testContext.client.connect()
  }

  beforeAll(async () => {
    testContext = await setupClient()
  })
  afterAll(async () => teardownClient(testContext))

  beforeEach(async () => {
    paymentTx = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Amount: AMOUNT,
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      DestinationTag: 1,
      Fee: '12',
      Flags: 2147483648,
      LastLedgerSequence: 65953073,
      Sequence: 65923914,
      SigningPubKey:
        '02F9E33F16DF9507705EC954E3F94EB5F10D1FC4A354606DBE6297DBB1096FE654',
      TxnSignature:
        '3045022100E3FAE0EDEC3D6A8FF6D81BC9CF8288A61B7EEDE8071E90FF9314CB4621058D10022043545CF631706D700CEE65A1DB83EFDD185413808292D9D90F14D87D3DC2D8CB',
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      Paths: [
        [{ currency: 'BTC', issuer: 'r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X' }],
      ],
      SendMax: '100000000',
    }
  })

  it('Validate Payment transaction API v2: Payment Transaction: Specify Only Amount field', async function () {
    const txResult = await testContext.client.autofill(paymentTx)

    assert.strictEqual(txResult.Amount, AMOUNT)
  })

  it('Validate Payment transaction API v2: Payment Transaction: Specify Only DeliverMax field', async function () {
    // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
    paymentTx.DeliverMax = paymentTx.Amount
    // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
    delete paymentTx.Amount
    const txResult = await testContext.client.autofill(paymentTx)

    assert.strictEqual(txResult.Amount, AMOUNT)
  })

  it('Validate Payment transaction API v2: Payment Transaction: identical DeliverMax and Amount fields', async function () {
    // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
    paymentTx.DeliverMax = paymentTx.Amount

    const txResult = await testContext.client.autofill(paymentTx)

    assert.strictEqual(txResult.Amount, AMOUNT)
    assert.strictEqual('DeliverMax' in txResult, false)
  })

  it('Validate Payment transaction API v2: Payment Transaction: differing DeliverMax and Amount fields', async function () {
    // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
    paymentTx.DeliverMax = '6789'
    paymentTx.Amount = '1234'

    await assertRejects(testContext.client.autofill(paymentTx), ValidationError)
  })

  it('should not autofill if fields are present', async function () {
    const tx: Transaction = {
      TransactionType: 'DepositPreauth',
      Account: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      NetworkID,
      Fee,
      Sequence,
      LastLedgerSequence,
    }
    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.NetworkID, NetworkID)
    assert.strictEqual(txResult.Fee, Fee)
    assert.strictEqual(txResult.Sequence, Sequence)
    assert.strictEqual(txResult.LastLedgerSequence, LastLedgerSequence)
  })

  it('ignores network ID if missing', async function () {
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
      Amount: '1234',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
      Fee,
      Sequence,
      LastLedgerSequence,
    }
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)

    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.NetworkID, undefined)
  })

  // NetworkID is required in transaction for network > 1024 and from version 1.11.0 or later.
  // More context: https://github.com/XRPLF/rippled/pull/4370
  it('overrides network ID if > 1024 and version is later than 1.11.0', async function () {
    await setupMockRippledVersionAndID('1.11.1', 1025)
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
      Amount: '1234',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
      Fee,
      Sequence,
      LastLedgerSequence,
    }
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)

    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.NetworkID, 1025)
  })

  // NetworkID is only required in transaction for version 1.11.0 or later.
  // More context: https://github.com/XRPLF/rippled/pull/4370
  it('ignores network ID if > 1024 but version is earlier than 1.11.0', async function () {
    await setupMockRippledVersionAndID('1.10.0', 1025)
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
      Amount: '1234',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
      Fee,
      Sequence,
      LastLedgerSequence,
    }
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)

    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.NetworkID, undefined)
  })

  // NetworkID <= 1024 does not require a newtorkID in transaction.
  // More context: https://github.com/XRPLF/rippled/pull/4370
  it('ignores network ID if <= 1024', async function () {
    await setupMockRippledVersionAndID('1.11.1', 1023)
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
      Amount: '1234',
      Destination: 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
      Fee,
      Sequence,
      LastLedgerSequence,
    }
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)

    const txResult = await testContext.client.autofill(tx)

    assert.strictEqual(txResult.NetworkID, undefined)
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
