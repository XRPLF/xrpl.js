import { assert } from 'chai'

import { CheckCreate } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('CheckCreate', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const tx: CheckCreate = {
        TransactionType: 'CheckCreate',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        SendMax: '50',
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // confirm that the check actually went through
      const accountOffersResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'check',
      })
      assert.lengthOf(
        accountOffersResponse.result.account_objects,
        1,
        'Should be exactly one check on the ledger',
      )
    },
    TIMEOUT,
  )
})
