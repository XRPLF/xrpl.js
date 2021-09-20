/* eslint-disable mocha/no-hooks-for-single-case -- Use of hooks is restricted when there is a single test case. */
import { assert } from 'chai'
import _ from 'lodash'

import { AccountCurrenciesRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountCurrencies', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountCurrenciesRequest = {
      command: 'account_currencies',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      strict: true,
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
  })
})
