import { assert } from 'chai'
import omit from 'lodash/omit'

import { FeeRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('fee', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: FeeRequest = {
        command: 'fee',
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          current_ledger_size: '0',
          current_queue_size: '0',
          drops: {
            base_fee: '10',
            median_fee: '5000',
            minimum_fee: '10',
            open_ledger_fee: '10',
          },
          expected_ledger_size: '1000',
          ledger_current_index: 2925,
          levels: {
            median_level: '128000',
            minimum_level: '256',
            open_ledger_level: '256',
            reference_level: '256',
          },
          max_queue_size: '20000',
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(typeof response.result.ledger_current_index, 'number')
      assert.deepEqual(
        omit(response.result, ['ledger_current_index']),
        omit(expected.result, ['ledger_current_index']),
      )
    },
    TIMEOUT,
  )
})
