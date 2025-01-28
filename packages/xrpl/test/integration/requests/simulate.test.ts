import { assert } from 'chai'

import { SimulateRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('simulate', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'json',
    async () => {
      const simulateRequest: SimulateRequest = {
        command: 'simulate',
        tx_json: {
          TransactionType: 'AccountSet',
          Account: testContext.wallet.address,
          NFTokenMinter: testContext.wallet.address,
        },
      }
      const simulateResponse = await testContext.client.request(simulateRequest)

      assert.equal(simulateResponse.type, 'response')
      assert.typeOf(simulateResponse.result.meta, 'object')
      assert.equal(simulateResponse.result.engine_result, 'tesSUCCESS')
      assert.isFalse(simulateResponse.result.applied)
    },
    TIMEOUT,
  )

  it(
    'binary',
    async () => {
      const simulateRequest: SimulateRequest = {
        command: 'simulate',
        tx_json: {
          TransactionType: 'AccountSet',
          Account: testContext.wallet.address,
        },
        binary: true,
      }
      const simulateResponse = await testContext.client.request(simulateRequest)

      assert.equal(simulateResponse.type, 'response')
      assert.typeOf(simulateResponse.result.meta_blob, 'string')
      assert.equal(simulateResponse.result.tx_blob, 'string')
      assert.equal(simulateResponse.result.engine_result, 'tesSUCCESS')
      assert.isFalse(simulateResponse.result.applied)
    },
    TIMEOUT,
  )
})
