import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'

async function assertDoesNotThrow(promise: Promise<unknown>): Promise<void> {
  try {
    await promise
    assert(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- should be type error
  } catch (err: any) {
    assert.fail(err.message || err)
  }
}

describe('Client subscription', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('Successfully Subscribes', async function () {
    this.mockRippled.addResponse('subscribe', rippled.subscribe.success)

    await assertDoesNotThrow(this.client.request({ command: 'subscribe' }))
  })

  it('Successfully Unsubscribes', async function () {
    this.mockRippled.addResponse('unsubscribe', rippled.unsubscribe)

    await assertDoesNotThrow(
      this.client.request({
        command: 'unsubscribe',
      }),
    )
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
