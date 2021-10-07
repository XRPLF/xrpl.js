import { assert } from 'chai'
import _ from 'lodash'

import { FeeRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('fee', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: FeeRequest = {
      command: 'fee',
    }
    const response = await this.client.request(request)
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
      _.omit(response.result, ['ledger_current_index']),
      _.omit(expected.result, ['ledger_current_index']),
    )
  })
})
