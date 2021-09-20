import { assert } from 'chai'
import _ from 'lodash'

import { AccountChannelsRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { createChannel } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountChannels', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    createChannel(this.client, this.wallet)
    const request: AccountChannelsRequest = {
      id: 1,
      command: 'account_channels',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      ledger_index: 'validated',
    }
    const response = await this.client.requestAll(request)
    console.log(response)
    assert.equal(response[0].status, 'success')
    assert.equal(response[0].type, 'response')
  })
})
