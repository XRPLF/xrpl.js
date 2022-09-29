import { assert } from 'chai'
import _ from 'lodash'
import { AccountOffersRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_offers', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: AccountOffersRequest = {
        command: 'account_offers',
        account: testContext.wallet.classicAddress,
        strict: true,
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account: testContext.wallet.classicAddress,
          ledger_current_index: 1443,
          offers: [],
          validated: false,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(typeof response.result.ledger_current_index, 'number')
      assert.deepEqual(
        _.omit(response.result, 'ledger_current_index'),
        _.omit(expected.result, 'ledger_current_index'),
      )
    },
    TIMEOUT,
  )
})
