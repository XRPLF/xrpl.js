import { assert } from 'chai'
import _ from 'lodash'

import { DepositAuthorizedRequest, DepositAuthorizedResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DepositAuthorized', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = generateFundedWallet(this.client)
    const depositAuthorized: DepositAuthorizedRequest = {
      command: 'deposit_authorized',
      source_account: this.wallet.getClassicAddress(),
      destination_account: (await wallet2).getClassicAddress(),
    }

    const response: DepositAuthorizedResponse = await this.client.request(
      depositAuthorized,
    )
    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
  })
})
