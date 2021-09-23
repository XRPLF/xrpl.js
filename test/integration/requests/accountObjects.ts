import { assert } from 'chai'
import _ from 'lodash'

import { AccountObjectsRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountObjects', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountObjectsRequest = {
      id: 8,
      command: 'account_objects',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 8,
      result: {
        account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        account_objects: [],
        ledger_hash:
          '28D68B351ED58B9819502EF5FC05BA4412A048597E5159E1C226703BDF7C7897',
        ledger_index: 1294,
        validated: true,
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    assert.deepEqual(
      _.omit(response.result, ['ledger_hash', 'ledger_index']),
      _.omit(expected.result, ['ledger_hash', 'ledger_index']),
    )
  })
})
