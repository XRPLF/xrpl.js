import { assert } from 'chai'

import {
  XChainCreateBridge,
  XChainCreateClaimID,
  XChainBridge,
  Wallet,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  GENESIS_ACCOUNT,
  testTransaction,
} from '../utils'

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
      const bridge: XChainBridge = {
        LockingChainDoor: testContext.wallet.classicAddress,
        LockingChainIssue: { currency: 'XRP' },
        IssuingChainDoor: GENESIS_ACCOUNT,
        IssuingChainIssue: { currency: 'XRP' },
      }
      const signatureReward = '200'
      // set up a bridge
      const setupTx: XChainCreateBridge = {
        TransactionType: 'XChainCreateBridge',
        Account: testContext.wallet.classicAddress,
        XChainBridge: bridge,
        SignatureReward: signatureReward,
        MinAccountCreateAmount: '10000000',
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      // confirm that the transaction actually went through
      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'bridge',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one bridge owned by the account',
      )

      // actually test XChainCreateClaimID
      const wallet2 = await generateFundedWallet(testContext.client)
      const otherChainSource = Wallet.generate()
      const tx: XChainCreateClaimID = {
        TransactionType: 'XChainCreateClaimID',
        Account: wallet2.classicAddress,
        XChainBridge: bridge,
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
