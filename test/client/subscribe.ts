import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import {setupClient, teardownClient} from '../setupClient'


describe('Subscription', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('Successfully Subscribes', async function () {
    this.mockRippled.addResponse('subscribe', rippled.subscribe.success)

    const result = await this.client.request({
      command: 'subscribe',
    })

    assert.equal(result.status, 'success')
  })

  it('Successfully Unsubscribes', async function () {
    this.mockRippled.addResponse('unsubscribe', rippled.unsubscribe)

    const result = await this.client.request({
      command: 'unsubscribe',
    })

    assert.equal(result.status, 'success')
  })

  it('Emits transaction', async function (done) {
    this.client.on('transaction', (tx) => {
      assert(tx.type === 'transaction')
      done()
    })

    this.client.connection.onMessage(
      JSON.stringify(rippled.streams.transaction),
    )
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

  it('Emits peerStatusChange', async function (done) {
    this.client.on('peerStatusChange', (path) => {
      assert(path.type === 'peerStatusChange')
      done()
    })

    this.client.connection.onMessage(JSON.stringify(rippled.streams.peerStatus))
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
