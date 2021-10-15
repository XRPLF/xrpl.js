import { assert } from 'chai'
import _ from 'lodash'

import { AccountOffersRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_offers', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountOffersRequest = {
      command: 'account_offers',
      account: this.wallet.classicAddress,
      strict: true,
    }
    const response = await this.client.request(request)
    const expected = {
      id: 0,
      result: {
        account: this.wallet.classicAddress,
        ledger_current_index: 1443,
        offers: [],
        validated: false,
      },
      type: 'response',
    }
    assert.equal(response.type, expected.type)
    assert.equal(typeof response.result.ledger_current_index, 'number')
    assert.deepEqual(
      _.omit(response.result, 'ledger_current_index'),
      _.omit(expected.result, 'ledger_current_index'),
    )
  })
})
