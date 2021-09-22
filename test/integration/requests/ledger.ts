import { assert } from 'chai'
import _ from 'lodash'

import { LedgerRequest, LedgerResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const ledgerRequest: LedgerRequest = {
      command: 'ledger',
      ledger_index: 'validated',
    }

    const ledgerResponse: LedgerResponse = await this.client.request(
      ledgerRequest,
    )

    const expectedResponse: LedgerResponse = {
      id: ledgerResponse.id,
      status: 'success',
      type: 'response',
      result: {
        ledger: ledgerResponse.result.ledger,
        ledger_hash: ledgerResponse.result.ledger_hash,
        ledger_index: ledgerResponse.result.ledger_index,
        validated: true,
      },
    }

    verifySuccessfulResponse(ledgerResponse)
    assert.deepEqual(ledgerResponse, expectedResponse)
  })
})
