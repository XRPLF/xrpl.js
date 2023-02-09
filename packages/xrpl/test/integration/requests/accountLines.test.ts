import { assert } from 'chai'
import omit from 'lodash/omit'

import { AccountLinesRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_lines', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: AccountLinesRequest = {
        command: 'account_lines',
        account: testContext.wallet.classicAddress,
        strict: true,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account: testContext.wallet.classicAddress,
          ledger_hash:
            '0C09AAFA88AC1A616058220CF33269788D3985DAA6F2386196D4A7404252BB61',
          ledger_index: 1074,
          lines: [],
          validated: true,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(typeof response.result.ledger_hash, 'string')
      assert.equal(typeof response.result.ledger_index, 'number')
      assert.deepEqual(
        omit(response.result, ['ledger_hash', 'ledger_index']),
        omit(expected.result, ['ledger_hash', 'ledger_index']),
      )
    },
    TIMEOUT,
  )
})
