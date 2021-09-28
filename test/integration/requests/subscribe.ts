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
} from 'xrpl-local'

import rippled from '../../fixtures/rippled'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { ledgerAccept, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('subscribe', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

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

  // TODO: Add transactions_proposed test
  // TODO: Add accounts test
  // TODO: Add accounts_proposed test
  // TODO: Add a books test

  // TODO: Check how we might be able to do integration tests on peerStatusChange

  it('Emits transaction', async function () {
    const event = new Promise((resolve, reject) => {
      const client: Client = this.client
      client.on('transaction', (tx) => {
        assert.equal(tx.type, 'transaction')
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

    return event
  })

  it('Emits ledger', async function () {
    const event = new Promise((resolve, reject) => {
      const client: Client = this.client
      client.on('ledgerClosed', (ledger) => {
        assert.equal(ledger.type, 'ledgerClosed')
        resolve('success')
      })
    })

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

    // Trigger the event
    ledgerAccept(this.client)

    return event
  })

  // it('Emits peerStatusChange', async function () {
  //   const event = new Promise((resolve, reject) => {
  //     const client: Client = this.client
  //     client.on('peerStatusChange', (ledger) => {
  //       assert.equal(ledger.type, 'peerStatusChange')
  //       resolve('success')
  //     })
  //   })

  //   this.client.connection.onMessage(JSON.stringify(rippled.streams.peerStatus))
  // })

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
