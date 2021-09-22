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

    const ledgerCurrentResponse: LedgerCurrentResponse =
      await this.client.request(ledgerCurrentRequest)

    verifySuccessfulResponse(ledgerCurrentResponse)
  })
})
