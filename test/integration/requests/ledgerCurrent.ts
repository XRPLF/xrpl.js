import { assert } from 'chai'
import _ from 'lodash'

import { LedgerCurrentResponse, LedgerCurrentRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_current', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const ledgerCurrentRequest: LedgerCurrentRequest = {
      command: 'ledger_current',
    }

    const ledgerCurrentResponse = await this.client.request(
      ledgerCurrentRequest,
    )

    verifySuccessfulResponse(ledgerCurrentResponse)

    const expectedResponse: LedgerCurrentResponse = {
      id: ledgerCurrentResponse.id,
      status: 'success',
      type: 'response',
      result: {
        ledger_current_index: ledgerCurrentResponse.result.ledger_current_index,
      },
    }
    assert.deepEqual(ledgerCurrentResponse, expectedResponse)
  })
})
