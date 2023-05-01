import { assert } from 'chai'

import {
  XChainCreateBridge,
  XChainAccountCreateCommit,
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

describe('XChainAccountCreateCommit', function () {
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
      const accountInfoResponse = await testContext.client.request({
        command: 'account_info',
        account: testContext.wallet.classicAddress,
      })
      const initialBalance = Number(
        accountInfoResponse.result.account_data.Balance,
      )

      // actually test XChainAccountCreateCommit
      const wallet2 = await generateFundedWallet(testContext.client)
      const destination = Wallet.generate()
      const amount = 10000000
      const tx: XChainAccountCreateCommit = {
        TransactionType: 'XChainAccountCreateCommit',
        Account: wallet2.classicAddress,
        XChainBridge: bridge,
        Amount: amount.toString(),
        SignatureReward: signatureReward,
        Destination: destination.classicAddress,
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
        initialBalance + amount + Number(signatureReward),
        finalBalance,
        "The bridge door's balance should go up by the amount committed",
      )
    },
    TIMEOUT,
  )
})
