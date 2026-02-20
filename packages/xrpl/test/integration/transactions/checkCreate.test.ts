import { assert } from 'chai'

import { CheckCreate } from '../../../src'
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

  it(
    'CheckCreate with MPT',
    async () => {
      const checkDestinationWallet = await generateFundedWallet(
        testContext.client,
      )

      const mptIssuanceId = await createMPTIssuanceAndAuthorize(
        testContext.client,
        testContext.wallet,
        checkDestinationWallet,
      )

      const tx: CheckCreate = {
        TransactionType: 'CheckCreate',
        Account: testContext.wallet.classicAddress,
        Destination: checkDestinationWallet.classicAddress,
        // @ts-expect-error -- MPTAmount support will be added to CheckCreate.SendMax
        SendMax: {
          mpt_issuance_id: mptIssuanceId,
          value: '50',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // Confirm the check exists on the ledger
      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'check',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one check on the ledger',
      )

      const checkNode = accountObjectsResponse.result.account_objects[0]
      assert.deepEqual(
        // @ts-expect-error -- SendMax type will support MPTAmount
        checkNode.SendMax,
        {
          mpt_issuance_id: mptIssuanceId,
          value: '50',
        },
      )
    },
    TIMEOUT,
  )
})
