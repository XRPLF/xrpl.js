import { assert } from 'chai'
import _ from 'lodash'

import {
  LedgerRequest,
  LedgerResponse,
  LedgerClosedRequest,
  LedgerClosedResponse,
  LedgerCurrentResponse,
  LedgerCurrentRequest,
  LedgerDataRequest,
  LedgerDataResponse,
  LedgerEntryRequest,
  LedgerEntryResponse,
} from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { verifySuccessfulResponse } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Ledger Methods', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('Ledger', async function () {
    const ledgerRequest: LedgerRequest = {
      command: 'ledger',
      ledger_index: 'validated',
    }

    const ledgerResponse: LedgerResponse = await this.client.request(
      ledgerRequest,
    )

    verifySuccessfulResponse(ledgerResponse)
    assert.ok(ledgerResponse.result.validated)
  })

  it('LedgerClosed', async function () {
    const ledgerClosedRequest: LedgerClosedRequest = {
      command: 'ledger_closed',
    }
    const ledgerClosedResponse: LedgerClosedResponse =
      await this.client.request(ledgerClosedRequest)

    verifySuccessfulResponse(ledgerClosedResponse)
  })

  it('LedgerCurrent', async function () {
    const ledgerCurrentRequest: LedgerCurrentRequest = {
      command: 'ledger_current',
    }

    const ledgerCurrentResponse: LedgerCurrentResponse =
      await this.client.request(ledgerCurrentRequest)

    verifySuccessfulResponse(ledgerCurrentResponse)
  })

  it('LedgerData', async function () {
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

  it('LedgerEntry', async function () {
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
