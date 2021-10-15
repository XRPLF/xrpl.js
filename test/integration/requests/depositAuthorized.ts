import { assert } from 'chai'
import _ from 'lodash'

import { DepositAuthorizedRequest, DepositAuthorizedResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('deposit_authorized', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const depositAuthorized: DepositAuthorizedRequest = {
      command: 'deposit_authorized',
      source_account: this.wallet.getClassicAddress(),
      destination_account: wallet2.getClassicAddress(),
    }

    const response = await this.client.request(depositAuthorized)

    const expectedResponse: DepositAuthorizedResponse = {
      id: response.id,
      type: 'response',
      result: {
        deposit_authorized: true,
        destination_account: depositAuthorized.destination_account,
        ledger_current_index: response.result.ledger_current_index,
        source_account: depositAuthorized.source_account,
        validated: false,
      },
    }

    assert.deepEqual(response, expectedResponse)
  })
})
