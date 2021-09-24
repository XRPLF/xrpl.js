import { assert } from 'chai'
import _ from 'lodash'

import { LedgerClosedRequest, LedgerClosedResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_closed', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const ledgerClosedRequest: LedgerClosedRequest = {
      command: 'ledger_closed',
    }
    const ledgerClosedResponse: LedgerClosedResponse =
      await this.client.request(ledgerClosedRequest)

    verifySuccessfulResponse(ledgerClosedResponse)

    const expectedResponse: LedgerClosedResponse = {
      id: ledgerClosedResponse.id,
      status: 'success',
      type: 'response',
      result: {
        ledger_hash: ledgerClosedResponse.result.ledger_hash,
        ledger_index: ledgerClosedResponse.result.ledger_index,
      },
    }
    assert.deepEqual(ledgerClosedResponse, expectedResponse)
  })
})
