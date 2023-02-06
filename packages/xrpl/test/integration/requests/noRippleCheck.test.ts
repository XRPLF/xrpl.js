import { assert } from 'chai'

import { NoRippleCheckRequest, type AccountSet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('noripple_check', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: NoRippleCheckRequest = {
        command: 'noripple_check',
        account: testContext.wallet.classicAddress,
        role: 'gateway',
        ledger_index: 'current',
        transactions: true,
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          ledger_current_index: 2535,
          problems: ['You should immediately set your default ripple flag'],
          transactions: [
            {
              Account: testContext.wallet.classicAddress,
              Fee: 10,
              Sequence: 1268,
              SetFlag: 8,
              TransactionType: 'AccountSet',
            },
          ],
          validated: false,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(typeof response.result.transactions[0].Fee, 'number')
      assert.equal(typeof response.result.transactions[0].Sequence, 'number')
      assert.equal(typeof response.result.problems, 'object')
      assert.equal(typeof response.result.problems[0], 'string')

      const responseTx = response.result.transactions[0]
      const expectedTx = expected.result.transactions[0]
      assert.deepEqual(
        [
          responseTx.Account,
          (responseTx as AccountSet).SetFlag,
          responseTx.TransactionType,
        ],
        [expectedTx.Account, expectedTx.SetFlag, expectedTx.TransactionType],
      )
    },
    TIMEOUT,
  )
})
