import { assert } from 'chai'
import _ from 'lodash'

import { LedgerDataRequest, LedgerDataResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_data', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const ledgerDataRequest: LedgerDataRequest = {
      command: 'ledger_data',
      ledger_index: 'validated',
    }

    const ledgerDataResponse: LedgerDataResponse = await this.client.request(
      ledgerDataRequest,
    )

    verifySuccessfulResponse(ledgerDataResponse)

    // Removing the deprecated field 'ledger' which is returned by the 'ledger_data' request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing this field let's us test the request shape
    delete (ledgerDataResponse.result as any).ledger

    const expectedResponse: LedgerDataResponse = {
      id: ledgerDataResponse.id,
      result: {
        ledger_hash: ledgerDataResponse.result.ledger_hash,
        ledger_index: ledgerDataResponse.result.ledger_index,
        marker: ledgerDataResponse.result.marker,
        state: ledgerDataResponse.result.state,
        validated: true,
      },
      status: 'success',
      type: 'response',
    }

    assert(ledgerDataResponse.result.state.length > 0)
    assert.deepEqual(ledgerDataResponse, expectedResponse)
  })
})
