import { assert } from 'chai'
import _ from 'lodash'

import { LedgerDataRequest, LedgerDataResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('LedgerData', function () {
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
    assert(ledgerDataResponse.result.state.length > 0)
  })
})
