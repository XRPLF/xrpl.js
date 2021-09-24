import { assert } from 'chai'
import _ from 'lodash'

import { LedgerDataRequest } from 'xrpl-local'

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

    const ledgerDataResponse = await this.client.request(ledgerDataRequest)

    verifySuccessfulResponse(ledgerDataResponse)

    assert.equal(ledgerDataResponse.result.validated, true)
    assert(ledgerDataResponse.result.state.length > 0)
    assert.equal(ledgerDataResponse.status, 'success')
    assert.equal(ledgerDataResponse.type, 'response')
  })
})
