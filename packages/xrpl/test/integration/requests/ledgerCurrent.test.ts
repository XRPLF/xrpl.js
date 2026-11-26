import { assert } from 'chai'

import { LedgerCurrentResponse, LedgerCurrentRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_current', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const ledgerCurrentRequest: LedgerCurrentRequest = {
        command: 'ledger_current',
      }

      const ledgerCurrentResponse =
        await testContext.client.request(ledgerCurrentRequest)

      const expectedResponse: LedgerCurrentResponse = {
        id: ledgerCurrentResponse.id,
        type: 'response',
        result: {
          ledger_current_index: 1,
        },
      }
      assert.equal(ledgerCurrentResponse.type, expectedResponse.type)
      assert.typeOf(ledgerCurrentResponse.result.ledger_current_index, 'number')
    },
    TIMEOUT,
  )
})
