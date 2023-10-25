import { assert } from 'chai'

import { XChainCreateClaimID, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupBridge,
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('XChainCreateClaimID', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const { xchainBridge, signatureReward } = await setupBridge(
        testContext.client,
      )

      // actually test XChainCreateClaimID
      const wallet2 = await generateFundedWallet(testContext.client)
      const otherChainSource = Wallet.generate()
      const tx: XChainCreateClaimID = {
        TransactionType: 'XChainCreateClaimID',
        Account: wallet2.classicAddress,
        XChainBridge: xchainBridge,
        SignatureReward: signatureReward,
        OtherChainSource: otherChainSource.classicAddress,
      }

      await testTransaction(testContext.client, tx, wallet2)

      const accountObjectsResponse2 = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'xchain_owned_claim_id',
      })
      assert.lengthOf(
        accountObjectsResponse2.result.account_objects,
        1,
        'Should be exactly one claim ID owned by the account',
      )
    },
    TIMEOUT,
  )
})
