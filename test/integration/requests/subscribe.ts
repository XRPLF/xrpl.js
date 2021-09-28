import { assert } from 'chai'
import _ from 'lodash'

import {
  Client,
  OfferCreate,
  SubscribeRequest,
  SubscribeResponse,
  //  SubscribeRequest,
  // OfferCreate,
  // SubscribeRequest,
  // SubscribeResponse,
} from '../../../src'
import rippled from '../../fixtures/rippled'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('subscribe', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('Successfully Subscribes', async function () {
    //    this.mockRippled.addResponse('subscribe', rippled.subscribe.success)

    const result = await this.client.request({
      command: 'subscribe',
    })

    assert.equal(result.status, 'success')
  })

  it('Successfully Unsubscribes', async function () {
    // this.mockRippled.addResponse('unsubscribe', rippled.unsubscribe)

    const result = await this.client.request({
      command: 'unsubscribe',
    })

    assert.equal(result.status, 'success')
  })

  it('Emits transaction', async function () {
    const event = new Promise((resolve, reject) => {
      const client: Client = this.client
      client.on('transaction', (tx) => {
        assert(tx.type === 'transaction')
        resolve('success')
      })
    })

    const request: SubscribeRequest = {
      command: 'subscribe',
      streams: ['transactions'],
      accounts: [this.wallet.getClassicAddress()],
    }

    const response: SubscribeResponse = await this.client.request(request)

    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
    assert.deepEqual(response.result, {})

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

    // this.client.connection.onMessage(
    //   JSON.stringify(rippled.streams.transaction),
    // )

    return event
  })

  it('Emits ledger', async function (done) {
    this.client.on('ledgerClosed', (ledger) => {
      assert(ledger.type === 'ledgerClosed')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.ledger))
  })

  it('Emits peerStatusChange', async function (done) {
    this.client.on('peerStatusChange', (status) => {
      assert(status.type === 'peerStatusChange')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.peerStatus))
  })

  it('Emits consensusPhase', async function (done) {
    this.client.on('consensusPhase', (phase) => {
      assert(phase.type === 'consensusPhase')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.consensus))
  })

  it('Emits path_find', async function (done) {
    this.client.on('path_find', (path) => {
      assert(path.type === 'path_find')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.pathFind))
  })

  it('Emits validationReceived', async function (done) {
    this.client.on('validationReceived', (path) => {
      assert(path.type === 'validationReceived')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.validation))
  })

  it('Emits manifestReceived', async function (done) {
    this.client.on('manifestReceived', (path) => {
      assert(path.type === 'manifestReceived')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.manifest))
  })
})
