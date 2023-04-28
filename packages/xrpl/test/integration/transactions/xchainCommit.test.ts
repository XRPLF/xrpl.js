import { assert } from 'chai'

import { XChainCreateBridge, XChainCommit, XChainBridge } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('XChainCommit', function () {
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
        IssuingChainDoor: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
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
      const accountInfoResponse = await testContext.client.request({
        command: 'account_info',
        account: testContext.wallet.classicAddress,
      })
      const initialBalance = Number(
        accountInfoResponse.result.account_data.Balance,
      )

      // actually test XChainCommit
      const wallet2 = await generateFundedWallet(testContext.client)
      const amount = 10000000
      const tx: XChainCommit = {
        TransactionType: 'XChainCommit',
        Account: wallet2.classicAddress,
        XChainBridge: bridge,
        XChainClaimID: '0000000000000001',
        Amount: '10000000',
      }

      await testTransaction(testContext.client, tx, wallet2)

      const accountInfoResponse2 = await testContext.client.request({
        command: 'account_info',
        account: testContext.wallet.classicAddress,
      })
      const finalBalance = Number(
        accountInfoResponse2.result.account_data.Balance,
      )
      assert.equal(
        initialBalance + amount,
        finalBalance,
        "The bridge door's balance should go up by the amount committed",
      )
    },
    TIMEOUT,
  )
})
