import { assert } from 'chai'

import {
  Client,
  OfferCreate,
  SubscribeRequest,
  Wallet,
  SubscribeResponse,
} from '../../../src'
import { StreamType } from '../../../src/models/common'
import type { LedgerStreamResponse } from '../../../src/models/methods/subscribe'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { ledgerAccept, subscribeDone, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

async function createTxHandlerTest(
  client: Client,
  wallet: Wallet,
  subscriptionStream: StreamType,
): Promise<void> {
  const txStream = 'transaction'

  const transactionPromise = new Promise<void>((resolve) => {
    client.on(txStream, (tx) => {
      assert.equal(tx.type, txStream)
      subscribeDone(client)
      resolve()
    })
  })

  const request: SubscribeRequest = {
    command: 'subscribe',
    streams: [subscriptionStream],
    accounts: [wallet.classicAddress],
  }

  const response = await client.request(request)

  assert.equal(response.type, 'response')
  assert.deepEqual(response.result, {})

  return transactionPromise
}

describe('subscribe', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  /**
   * Subscribe streams which are not testable with just a standalone node:
   * (If that changes, please add tests for these streams).
   *
   * 'consensus'
   * 'manifests'
   * 'peer_status'
   * 'validations'
   * 'server'.
   */

  it(
    'Successfully Subscribes',
    async () => {
      const response: SubscribeResponse = await testContext.client.request({
        command: 'subscribe',
      })

      assert.deepEqual(response.result, {})
      assert.equal(response.type, 'response')
    },
    TIMEOUT,
  )

  it('Successfully Unsubscribes', async function () {
    const response = await testContext.client.request({
      command: 'unsubscribe',
    })

    assert.deepEqual(response.result, {})
    assert.equal(response.type, 'response')
  })

  it(
    'Emits transaction',
    async () => {
      const streamType = 'transactions'
      const transactionPromise = createTxHandlerTest(
        testContext.client,
        testContext.wallet,
        streamType,
      )
      // Trigger the event
      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: testContext.wallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
      await transactionPromise
    },
    TIMEOUT,
  )

  it(
    'Emits transaction on transactions_proposed',
    async () => {
      const transactionPromise = createTxHandlerTest(
        testContext.client,
        testContext.wallet,
        'transactions_proposed',
      )

      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: testContext.wallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
      }

      // The transactions_proposed stream should trigger the transaction handler WITHOUT ledgerAccept
      await testContext.client.submit(tx, { wallet: testContext.wallet })
      await transactionPromise
    },
    TIMEOUT,
  )

  it(
    'Emits ledger',
    async () => {
      const request: SubscribeRequest = {
        command: 'subscribe',
        streams: ['ledger'],
        accounts: [testContext.wallet.classicAddress],
      }

      await testContext.client.request(request).then(async (response) => {
        const ledgerResponse: LedgerStreamResponse =
          response.result as LedgerStreamResponse
        // Explicitly checking that there are only known fields in the return
        const expectedResult: LedgerStreamResponse = {
          fee_base: ledgerResponse.fee_base,
          ledger_hash: ledgerResponse.ledger_hash,
          ledger_index: ledgerResponse.ledger_index,
          ledger_time: ledgerResponse.ledger_time,
          reserve_base: ledgerResponse.reserve_base,
          reserve_inc: ledgerResponse.reserve_inc,
          validated_ledgers: ledgerResponse.validated_ledgers,
          network_id: ledgerResponse.network_id,
        }
        if (ledgerResponse.fee_ref) {
          expectedResult.fee_ref = ledgerResponse.fee_ref
        }
        assert.equal(response.type, 'response')
        assert.deepEqual(response.result, expectedResult)

        const client: Client = testContext.client
        const ledgerClosedPromise = new Promise<void>((resolve) => {
          client.on('ledgerClosed', (ledger) => {
            // Fields that are expected to change between the initial test and now are updated
            assert.deepEqual(ledger, {
              ...expectedResult,
              type: 'ledgerClosed',
              txn_count: ledger.txn_count,
              ledger_hash: ledger.ledger_hash,
              ledger_index:
                parseInt(expectedResult.ledger_index.toString(), 10) + 1,
              ledger_time: ledger.ledger_time,
              validated_ledgers: ledger.validated_ledgers,
            })
            subscribeDone(testContext.client)
            resolve()
          })
        })

        // Trigger the event
        await ledgerAccept(testContext.client)

        await ledgerClosedPromise
      })
    },
    TIMEOUT,
  )
})
