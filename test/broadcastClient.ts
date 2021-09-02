import { assert } from 'chai'
import _ from 'lodash'

import { ServerInfoResponse } from '../src'

import responses from './fixtures/responses'
import rippled from './fixtures/rippled'
import { setupBroadcast, teardownClient } from './setupClient'
import { ignoreWebSocketDisconnect } from './testUtils'

const TIMEOUT = 20000

async function checkResult(
  expected: Record<string, unknown>,
  response: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (expected.txJSON) {
    assert(response.txJSON)
    assert.deepEqual(
      JSON.parse(response.txJSON as string),
      JSON.parse(expected.txJSON as string),
    )
  }
  assert.deepEqual(_.omit(response, 'txJSON'), _.omit(expected, 'txJSON'))
  return response
}

describe('BroadcastClient', function () {
  this.timeout(TIMEOUT)
  beforeEach(setupBroadcast)
  afterEach(teardownClient)

  it('base', async function () {
    this.mocks.forEach((mock) => {
      mock.addResponse('server_info', rippled.server_info.normal)
    })
    assert(this.client.isConnected())
    this.client
      .request({ command: 'server_info' })
      .then(async (response: ServerInfoResponse) => {
        checkResult(responses.getServerInfo, response.result.info)
      })
  })

  it('error propagation', function (done) {
    const data = { error: 'type', error_message: 'info' }
    this.mocks.forEach((mock) => {
      mock.addResponse('echo', data)
    })
    this.client.once('error', (type, info) => {
      assert.strictEqual(type, 'type')
      assert.strictEqual(info, 'info')
      done()
    })
    this.client.clients[1].connection
      .request({
        command: 'echo',
        data,
      })
      .catch(ignoreWebSocketDisconnect)
  })
})
