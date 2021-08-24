import _ from 'lodash'
import assert from 'assert-diff'
import setupClient from './setup-client'
import responses from './fixtures/responses'
import rippled from './fixtures/rippled'
import {ignoreWebSocketDisconnect} from './utils'

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
      mock.addResponse({command: 'server_info'}, rippled.server_info.normal)
    })
    const expected = {request_server_info: 1}
    this.mocks.forEach((mock) => mock.expect(Object.assign({}, expected)))
    assert(this.client.isConnected())
    return this.client
      .request({command: "server_info"})
      .then(response => {
        return checkResult(responses.getServerInfo, response.result.info)
      })
  })

  it('error propagation', function (done) {
    this.client.once('error', (type, info) => {
      assert.strictEqual(type, 'type')
      assert.strictEqual(info, 'info')
      done()
    })
    this.client._clients[1].connection
      .request({
        command: 'echo',
        data: {error: 'type', error_message: 'info'}
      })
      .catch(ignoreWebSocketDisconnect)
  })
})
