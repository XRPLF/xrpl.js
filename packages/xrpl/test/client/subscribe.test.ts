import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

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
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('Successfully Subscribes', async function () {
    testContext.mockRippled!.addResponse('subscribe', rippled.subscribe.success)

    await assertDoesNotThrow(
      testContext.client.request({ command: 'subscribe' }),
    )
  })

  it('Successfully Unsubscribes', async function () {
    testContext.mockRippled!.addResponse('unsubscribe', rippled.unsubscribe)

    await assertDoesNotThrow(
      testContext.client.request({
        command: 'unsubscribe',
      }),
    )
  })

  it('Emits transaction', async function () {
    await new Promise<void>((resolve) => {
      testContext.client.on('transaction', (tx) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: Refactor as this seems pointless
        assert(tx.type === 'transaction')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.transaction),
      )
    })
  })

  it('Emits ledger', async function () {
    await new Promise<void>((resolve) => {
      testContext.client.on('ledgerClosed', (ledger) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: Refactor as this seems pointless
        assert(ledger.type === 'ledgerClosed')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.ledger),
      )
    })
  })

  it('Emits peerStatusChange', async function () {
    await new Promise<void>((resolve) => {
      testContext.client.on('peerStatusChange', (status) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: Refactor as this seems pointless
        assert(status.type === 'peerStatusChange')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.peerStatus),
      )
    })
  })

  it('Emits consensusPhase', async function () {
    await new Promise<void>((resolve) => {
      testContext.client.on('consensusPhase', (phase) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: Refactor as this seems pointless
        assert(phase.type === 'consensusPhase')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.consensus),
      )
    })
  })

  it('Emits path_find', async function () {
    await new Promise<void>((resolve) => {
      testContext.client.on('path_find', (path) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: Refactor as this seems pointless
        assert(path.type === 'path_find')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.pathFind),
      )
    })
  })

  it('Emits validationReceived', async function () {
    await new Promise<void>((resolve) => {
      testContext.client.on('validationReceived', (path) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: Refactor as this seems pointless
        assert(path.type === 'validationReceived')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.validation),
      )
    })
  })

  it('Emits manifestReceived', async function () {
    await new Promise<void>((resolve) => {
      // @es-expect-error Seems like a valid method
      testContext.client.on('manifestReceived', (path) => {
        assert(path.type === 'manifestReceived')
        resolve()
      })

      // @ts-expect-error Using private method for testing
      testContext.client.connection.onMessage(
        JSON.stringify(rippled.streams.manifest),
      )
    })
  })
})
