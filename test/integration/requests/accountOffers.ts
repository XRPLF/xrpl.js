import { assert } from 'chai'
import _ from 'lodash'

import { AccountOffersRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountOffers', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountOffersRequest = {
      command: 'account_offers',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      strict: true,
    }
    const response = await this.client.request(request)
    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
  })
})
