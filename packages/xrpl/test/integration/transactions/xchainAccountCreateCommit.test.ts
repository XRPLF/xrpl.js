import { assert } from 'chai'

import { XChainAccountCreateCommit, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, getXRPBalance, testTransaction } from '../utils'

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
      const initialBalance = Number(
        await getXRPBalance(
          testContext.client,
          testContext.bridge.xchainBridge.LockingChainDoor,
        ),
      )

      // actually test XChainAccountCreateCommit
      const wallet2 = await generateFundedWallet(testContext.client)
      const destination = Wallet.generate()
      const amount = 10000000
      const tx: XChainAccountCreateCommit = {
        TransactionType: 'XChainAccountCreateCommit',
        Account: wallet2.classicAddress,
        XChainBridge: testContext.bridge.xchainBridge,
        Amount: amount.toString(),
        SignatureReward: testContext.bridge.signatureReward,
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
        initialBalance + amount + Number(testContext.bridge.signatureReward),
        finalBalance,
        "The bridge door's balance should go up by the amount committed",
      )
    },
    TIMEOUT,
  )
})
