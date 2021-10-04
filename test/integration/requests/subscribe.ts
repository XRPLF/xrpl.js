/* eslint-disable @typescript-eslint/no-unused-vars-experimental -- rejected occurs naturally with timeout in promises */
/* eslint-disable @typescript-eslint/no-unused-vars -- rejected occurs naturally with timeout in promises */
import { assert } from 'chai'
import _ from 'lodash'

import {
  Client,
  LedgerStream,
  OfferCreate,
  SubscribeRequest,
  SubscribeResponse,
  Wallet,
} from 'xrpl-local'
import { StreamType } from 'xrpl-local/models/common'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { ledgerAccept, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

async function createTxHandlerTest(
  client: Client,
  wallet: Wallet,
  subscriptionStream: StreamType,
): Promise<unknown> {
  const event = new Promise((resolve, reject) => {
    client.on('transaction', (tx) => {
      assert.equal(tx.type, 'transaction')
      resolve('success')
    })
  })

  const request: SubscribeRequest = {
    command: 'subscribe',
    streams: [subscriptionStream],
    accounts: [wallet.getClassicAddress()],
  }

  const response: SubscribeResponse = await client.request(request)

  assert.equal(response.status, 'success')
  assert.equal(response.type, 'response')
  assert.deepEqual(response.result, {})

  return event
}

describe('subscribe', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  /**
   * Subscribe streams which are not testable with just a standalone node:
   * (If that changes, please add tests for these streams).
   *
   * 'consensus'
   * 'manifests'
   * 'peer_status'
   * 'validations'.
   */

  it('Successfully Subscribes', async function () {
    const result = await this.client.request({
      command: 'subscribe',
    })

    assert.equal(result.status, 'success')
  })

  it('Successfully Unsubscribes', async function () {
    const result = await this.client.request({
      command: 'unsubscribe',
    })

    assert.equal(result.status, 'success')
  })

  it('Emits transaction', async function () {
    const event = createTxHandlerTest(this.client, this.wallet, 'transactions')

    // Trigger the event
    const tx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: this.wallet.getClassicAddress(),
      TakerGets: '13100000',
      TakerPays: {
        currency: 'USD',
        issuer: this.wallet.getClassicAddress(),
        value: '10',
      },
    }

    await testTransaction(this.client, tx, this.wallet)

    // Lets the test wait until the event succeeds (or times out)
    return event
  })

  it('Emits transaction on transactions_proposed', async function () {
    const event = createTxHandlerTest(
      this.client,
      this.wallet,
      'transactions_proposed',
    )

    const tx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: this.wallet.getClassicAddress(),
      TakerGets: '13100000',
      TakerPays: {
        currency: 'USD',
        issuer: this.wallet.getClassicAddress(),
        value: '10',
      },
    }

    // The transactions_proposed stream should trigger the transaction handler WITHOUT ledgerAccept
    await this.client.submitTransaction(this.wallet, tx)

    // Lets the test wait until the event succeeds (or times out)
    return event
  })

  it('Emits ledger', async function () {
    const request: SubscribeRequest = {
      command: 'subscribe',
      streams: ['ledger'],
      accounts: [this.wallet.getClassicAddress()],
    }

    const response = await this.client.request(request)

    // Explicitly checking that there are only known fields in the return
    const expectedResult: LedgerStream = {
      fee_base: response.result.fee_base,
      fee_ref: response.result.fee_ref,
      ledger_hash: response.result.ledger_hash,
      ledger_index: response.result.ledger_index,
      ledger_time: response.result.ledger_time,
      reserve_base: response.result.reserve_base,
      reserve_inc: response.result.reserve_inc,
      validated_ledgers: response.result.validated_ledgers,
    }

    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
    assert.deepEqual(response.result, expectedResult)

    const event = new Promise((resolve, reject) => {
      const client: Client = this.client
      client.on('ledgerClosed', (ledger) => {
        // Fields that are expected to change between the initial test and now are updated
        assert.deepEqual(ledger, {
          ...expectedResult,
          type: 'ledgerClosed',
          txn_count: ledger.txn_count,
          ledger_hash: ledger.ledger_hash,
          ledger_index: expectedResult.ledger_index + 1,
          ledger_time: ledger.ledger_time,
          validated_ledgers: ledger.validated_ledgers,
        })
        resolve('success')
      })
    })

    // Trigger the event
    ledgerAccept(this.client)

    return event
  })
})
