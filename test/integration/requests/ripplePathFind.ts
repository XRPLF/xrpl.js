import { assert } from 'chai'
import _ from 'lodash'

import { RipplePathFindRequest, RipplePathFindResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('ripple_path_find', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const ripplePathFind: RipplePathFindRequest = {
      command: 'ripple_path_find',
      subcommand: 'create',
      source_account: this.wallet.getClassicAddress(),
      destination_account: wallet2.getClassicAddress(),
      destination_amount: '100',
    }

    const response = await this.client.request(ripplePathFind)

    const expectedResponse: RipplePathFindResponse = {
      id: response.id,
      type: 'response',
      result: {
        alternatives: response.result.alternatives,
        destination_account: wallet2.getClassicAddress(),
        destination_currencies: response.result.destination_currencies,
        destination_amount: ripplePathFind.destination_amount,
        full_reply: true,
        id: response.id,
        ledger_current_index: response.result.ledger_current_index,
        source_account: ripplePathFind.source_account,
        validated: false,
      },
    }

    assert.deepEqual(response, expectedResponse)
  })
})
