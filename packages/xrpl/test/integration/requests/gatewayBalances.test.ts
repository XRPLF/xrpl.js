import { assert } from 'chai'
import omit from 'lodash/omit'

import { GatewayBalancesRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('gateway_balances', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: GatewayBalancesRequest = {
        command: 'gateway_balances',
        account: testContext.wallet.classicAddress,
        ledger_index: 'validated',
        strict: true,
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account: testContext.wallet.classicAddress,
          ledger_hash:
            '28D68B351ED58B9819502EF5FC05BA4412A048597E5159E1C226703BDF7C7897',
          ledger_index: 1294,
          validated: true,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(typeof response.result.ledger_hash, 'string')
      assert.equal(typeof response.result.ledger_index, 'number')
      assert.deepEqual(
        omit(response.result, ['ledger_hash', 'ledger_index']),
        omit(expected.result, ['ledger_hash', 'ledger_index']),
      )
    },
    TIMEOUT,
  )
})
