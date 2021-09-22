import { assert } from 'chai'
import _ from 'lodash'

import { AccountTxRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountTx', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountTxRequest = {
      command: 'account_tx',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      ledger_index: 'validated',
    }
    const response = await this.client.requestAll(request)
    assert.equal(response[0].status, 'success')
    assert.equal(response[0].type, 'response')
  })
})
