import { assert } from 'chai'
import _ from 'lodash'

import { AccountObjectsRequest } from '../../../src'
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
    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
  })
})
