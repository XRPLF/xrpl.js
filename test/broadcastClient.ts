import { assert } from 'chai'
import _ from 'lodash'

import responses from './fixtures/responses'
import rippled from './fixtures/rippled'
import setupClient from './setupClient'
import { ignoreWebSocketDisconnect } from './testUtils'

const TIMEOUT = 20000

function checkResult(expected, response) {
  if (expected.txJSON) {
    assert(response.txJSON)
    assert.deepEqual(JSON.parse(response.txJSON), JSON.parse(expected.txJSON))
  }
  assert.deepEqual(_.omit(response, 'txJSON'), _.omit(expected, 'txJSON'))
  return response
}

describe('BroadcastClient', function () {
  this.timeout(TIMEOUT)
  beforeEach(setupClient.setupBroadcast)
  afterEach(setupClient.teardown)

  it('base', function () {
    this.mocks.forEach((mock) => {
      mock.addResponse('server_info', rippled.server_info.normal)
    })
    assert(this.client.isConnected())
    return this.client.request({ command: 'server_info' }).then((response) => {
      return checkResult(responses.getServerInfo, response.result.info)
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
