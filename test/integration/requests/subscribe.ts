import { assert } from 'chai'
import _ from 'lodash'

import { Client, OfferCreate, SubscribeRequest, Wallet } from 'xrpl-local'
import { StreamType } from 'xrpl-local/models/common'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup } from '../setup'
import { ledgerAccept, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

// eslint-disable-next-line max-params -- Helps keep things well-typed
async function createTxHandlerTest(
  client: Client,
  wallet: Wallet,
  done: Mocha.Done,
  subscriptionStream: StreamType,
): Promise<void> {
  client.on('transaction', (tx) => {
    assert.equal(tx.type, 'transaction')
    done()
  })

  const request: SubscribeRequest = {
    command: 'subscribe',
    streams: [subscriptionStream],
    accounts: [wallet.getClassicAddress()],
  }

  client.request(request).then((response) => {
    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
    assert.deepEqual(response.result, {})
  })
}

async function teardownClientAndClearListeners(
  this: Mocha.Context,
): Promise<void> {
  this.client.removeAllListeners()
  this.client.disconnect()
}

describe('subscribe', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClientAndClearListeners)

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

  it('Emits transaction', function (done) {
    const streamType = 'transactions'
    createTxHandlerTest(this.client, this.wallet, done, streamType).then(() => {
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

      testTransaction(this.client, tx, this.wallet)
    })
  })

  it('Emits transaction on transactions_proposed', function (done) {
    createTxHandlerTest(
      this.client,
      this.wallet,
      done,
      'transactions_proposed',
    ).then(() => {
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
      this.client.submitTransaction(this.wallet, tx)
    })
  })

  it('Emits ledger', function (done) {
    const request: SubscribeRequest = {
      command: 'subscribe',
      streams: ['ledger'],
      accounts: [this.wallet.getClassicAddress()],
    }

    this.client
      .request(request)
      .then((response) => {
        // Explicitly checking that there are only known fields in the return
        const expectedResult = {
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

        this.client.on('ledgerClosed', (ledger) => {
          // Fields that are expected to change between the initial test and now are updated
          assert.deepEqual(ledger, {
            ...expectedResult,
            type: 'ledgerClosed',
            txn_count: ledger.txn_count,
            ledger_hash: ledger.ledger_hash,
            ledger_index: parseInt(expectedResult.ledger_index, 10) + 1,
            ledger_time: ledger.ledger_time,
            validated_ledgers: ledger.validated_ledgers,
          })
          done()
        })
      })
      .then(() => {
        // Trigger the event
        ledgerAccept(this.client)
      })
  })
})
