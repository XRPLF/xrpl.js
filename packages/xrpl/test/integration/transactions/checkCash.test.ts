import { assert } from 'chai'

import { CheckCreate, CheckCash, LedgerEntry } from '../../../src'
import { createMPTIssuanceAndAuthorize } from '../mptUtils'
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

  it(
    'CheckCash with MPT',
    async () => {
      const checkDestinationWallet = await generateFundedWallet(
        testContext.client,
      )

      const mptIssuanceId = await createMPTIssuanceAndAuthorize(
        testContext.client,
        testContext.wallet,
        checkDestinationWallet,
      )

      // Create a check with MPT
      const setupTx: CheckCreate = {
        TransactionType: 'CheckCreate',
        Account: testContext.wallet.classicAddress,
        Destination: checkDestinationWallet.classicAddress,
        SendMax: {
          mpt_issuance_id: mptIssuanceId,
          value: '50',
        },
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      // Get check ID
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

      const checkObject = response1.result
        .account_objects[0] as LedgerEntry.Check
      const checkId = checkObject.index

      // Verify the check ledger object contents
      assert.equal(checkObject.Account, testContext.wallet.classicAddress)
      assert.equal(
        checkObject.Destination,
        checkDestinationWallet.classicAddress,
      )
      assert.deepEqual(checkObject.SendMax, {
        mpt_issuance_id: mptIssuanceId,
        value: '50',
      })

      // Cash the check with MPT
      const tx: CheckCash = {
        TransactionType: 'CheckCash',
        Account: checkDestinationWallet.classicAddress,
        CheckID: checkId,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: '50',
        },
      }

      await testTransaction(testContext.client, tx, checkDestinationWallet)

      // Confirm the check no longer exists
      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'check',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        0,
        'Should be no checks on the ledger',
      )
    },
    TIMEOUT,
  )
})
