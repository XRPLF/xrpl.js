import { assert } from 'chai'
import _ from 'lodash'
import { AccountChannelsRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_channels', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: AccountChannelsRequest = {
        command: 'account_channels',
        account: testContext.wallet.classicAddress,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account: testContext.wallet.classicAddress,
          channels: [],
          ledger_hash:
            'C8BFA74A740AA22AD9BD724781589319052398B0C6C817B88D55628E07B7B4A1',
          ledger_index: 150,
          validated: true,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(typeof response.result.ledger_hash, 'string')
      assert.equal(typeof response.result.ledger_index, 'number')
      assert.deepEqual(
        _.omit(response.result, ['ledger_hash', 'ledger_index']),
        _.omit(expected.result, ['ledger_hash', 'ledger_index']),
      )
    },
    TIMEOUT,
  )
})
