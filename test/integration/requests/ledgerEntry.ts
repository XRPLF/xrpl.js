import { assert } from 'chai'
import _ from 'lodash'

import {
  LedgerDataResponse,
  LedgerEntryRequest,
  LedgerEntryResponse,
} from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('LedgerEntry', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const validatedLedgerResponse: LedgerDataResponse =
      await this.client.request({
        command: 'ledger_data',
        ledger_index: 'validated',
      })

    verifySuccessfulResponse(validatedLedgerResponse)
    const ledgerEntryIndex = validatedLedgerResponse.result.state[0].index

    const ledgerEntryRequest: LedgerEntryRequest = {
      command: 'ledger_entry',
      index: ledgerEntryIndex,
    }

    const ledgerEntryResponse: LedgerEntryResponse = await this.client.request(
      ledgerEntryRequest,
    )

    verifySuccessfulResponse(ledgerEntryResponse)
    assert.equal(ledgerEntryResponse.result.index, ledgerEntryIndex)
  })
})
