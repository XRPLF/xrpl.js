import { assert } from 'chai'

import { LedgerClosedRequest, LedgerClosedResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_closed', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const ledgerClosedRequest: LedgerClosedRequest = {
        command: 'ledger_closed',
      }
      const ledgerClosedResponse: LedgerClosedResponse =
        await testContext.client.request(ledgerClosedRequest)

      const expectedResponse: LedgerClosedResponse = {
        id: ledgerClosedResponse.id,
        type: 'response',
        result: {
          ledger_hash: 'string',
          ledger_index: 1,
        },
      }
      assert.equal(ledgerClosedResponse.type, expectedResponse.type)
      assert.typeOf(ledgerClosedResponse.result.ledger_hash, 'string')
      assert.typeOf(ledgerClosedResponse.result.ledger_index, 'number')
    },
    TIMEOUT,
  )
})
