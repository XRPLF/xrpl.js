import { assert } from 'chai'
import _ from 'lodash'

import { LedgerCurrentResponse, LedgerCurrentRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

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

    const expectedResponse: LedgerCurrentResponse = {
      id: ledgerCurrentResponse.id,
      type: 'response',
      result: {
        ledger_current_index: 1,
      },
    }
    assert.equal(ledgerCurrentResponse.type, expectedResponse.type)
    assert.typeOf(ledgerCurrentResponse.result.ledger_current_index, 'number')
  })
})
