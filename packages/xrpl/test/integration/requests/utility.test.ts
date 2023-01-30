import { assert } from 'chai'
import _ from 'lodash'
import { Client } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Utility method integration tests', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('ping', async function () {
    const response = await (this.client as Client).request({
      command: 'ping',
    })
    const expected: unknown = {
      result: { role: 'admin', unlimited: true },
      type: 'response',
    }
    assert.deepEqual(_.omit(response, 'id'), expected)
  })

  it('random', async function () {
    const response = await (this.client as Client).request({
      command: 'random',
    })
    const expected = {
      id: 0,
      result: {
        random: '[random string of 64 bytes]',
      },
      type: 'response',
    }
    assert.equal(response.type, expected.type)
    assert.equal(response.result.random.length, 64)
  })
})
