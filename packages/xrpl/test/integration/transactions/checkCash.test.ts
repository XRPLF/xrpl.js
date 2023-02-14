import { assert } from 'chai'

import { CheckCreate, CheckCash } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('CheckCash', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const amount = '500'

      const setupTx: CheckCreate = {
        TransactionType: 'CheckCreate',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        SendMax: amount,
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      // get check ID
      const response1 = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'check',
      })
      assert.lengthOf(
        response1.result.account_objects,
        1,
        'Should be exactly one check on the ledger',
      )
      const checkId = response1.result.account_objects[0].index

      // actual test - cash the check
      const tx: CheckCash = {
        TransactionType: 'CheckCash',
        Account: wallet2.classicAddress,
        CheckID: checkId,
        Amount: amount,
      }

      await testTransaction(testContext.client, tx, wallet2)

      // confirm that the check no longer exists
      const accountOffersResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'check',
      })
      assert.lengthOf(
        accountOffersResponse.result.account_objects,
        0,
        'Should be no checks on the ledger',
      )
    },
    TIMEOUT,
  )
})
