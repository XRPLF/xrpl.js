import { assert } from 'chai'
import _ from 'lodash'
import { ServerInfoResponse } from 'xrpl-local'

import responses from './fixtures/responses'
import rippled from './fixtures/rippled'
import { setupBroadcast, teardownClient } from './setupClient'
import { assertResultMatch, ignoreWebSocketDisconnect } from './testUtils'

const TIMEOUT = 20000

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
      .then((response: ServerInfoResponse) => {
        assertResultMatch(responses.getServerInfo, response.result.info)
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
