import { assert } from 'chai'
import _ from 'lodash'

import { AccountOffersRequest } from 'xrpl-local'

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
    const expected = {
      id: 5,
      result: {
        account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        ledger_current_index: 1443,
        offers: [],
        validated: false,
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    assert.deepEqual(
      _.omit(response.result, 'ledger_current_index'),
      _.omit(expected.result, 'ledger_current_index'),
    )
  })
})
