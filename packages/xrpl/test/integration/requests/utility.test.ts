import { assert } from 'chai'
import omit from 'lodash/omit'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Utility method integration tests', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'ping',
    async () => {
      const response = await testContext.client.request({
        command: 'ping',
      })
      const expected: unknown = {
        api_version: 2,
        result: { role: 'admin', unlimited: true },
        type: 'response',
      }
      assert.deepEqual(omit(response, 'id'), expected)
    },
    TIMEOUT,
  )

  it(
    'random',
    async () => {
      const response = await testContext.client.request({
        command: 'random',
      })
      const expected = {
        api_version: 2,
        id: 0,
        result: {
          random: '[random string of 64 bytes]',
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(response.result.random.length, 64)
    },
    TIMEOUT,
  )
})
