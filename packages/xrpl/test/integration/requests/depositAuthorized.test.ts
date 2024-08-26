import { assert } from 'chai'

import {
  DepositAuthorizedRequest,
  DepositAuthorizedResponse,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('deposit_authorized', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const depositAuthorized: DepositAuthorizedRequest = {
        command: 'deposit_authorized',
        source_account: testContext.wallet.classicAddress,
        destination_account: wallet2.classicAddress,
      }

      const response = await testContext.client.request(depositAuthorized)

      const expectedResponse: DepositAuthorizedResponse = {
        api_version: 2,
        id: response.id,
        type: 'response',
        result: {
          deposit_authorized: true,
          destination_account: depositAuthorized.destination_account,
          ledger_current_index: response.result.ledger_current_index,
          source_account: depositAuthorized.source_account,
          validated: false,
        },
      }

      assert.deepEqual(response, expectedResponse)
    },
    TIMEOUT,
  )
})
