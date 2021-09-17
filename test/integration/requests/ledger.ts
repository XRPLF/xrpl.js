import _ from 'lodash'

import { LedgerRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Ledger', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('LedgerRequest', async function () {
    const ledgerRequest: LedgerRequest = {
      command: 'ledger',
    }
    this.client.request(ledgerRequest)
  })
})
