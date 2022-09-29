import { assert } from 'chai'
import _ from 'lodash'
import { BroadcastClient, ServerInfoResponse } from 'xrpl-local'

import responses from './fixtures/responses'
import rippled from './fixtures/rippled'
import {
  setupBroadcast,
  teardownClient,
  type XrplTestContext,
} from './setupClient'
import { assertResultMatch, ignoreWebSocketDisconnect } from './testUtils'

const TIMEOUT = 20000

describe.skip('BroadcastClient - Deprecated and skipped', () => {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupBroadcast()
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      testContext.mocks?.forEach((mock) => {
        mock.addResponse('server_info', rippled.server_info.normal)
      })
      assert(testContext.client.isConnected())
      await testContext.client
        .request({ command: 'server_info' })
        .then((response: ServerInfoResponse) => {
          assertResultMatch(responses.getServerInfo, response.result.info)
        })
    },
    TIMEOUT,
  )

  it(
    'error propagation',
    async () => {
      const data = { error: 'type', error_message: 'info' }
      testContext.mocks?.forEach((mock) => {
        mock.addResponse('echo', data)
      })

      const donePromise = new Promise<void>((resolve) => {
        testContext.client.once('error', (type, info) => {
          assert.strictEqual(type, 'type')
          assert.strictEqual(info, 'info')
          resolve()
        })
      })

      const broadcastClient = testContext.client as BroadcastClient
      // @ts-expect-error Explicitly testing private behavior
      await broadcastClient.clients[1].connection
        .request({
          command: 'echo',
          data,
        })
        .catch(ignoreWebSocketDisconnect)

      await donePromise
    },
    TIMEOUT,
  )
})
