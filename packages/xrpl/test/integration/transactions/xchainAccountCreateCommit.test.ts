import { assert } from 'chai'

import { XChainAccountCreateCommit, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
  setupBridge,
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
      const { xchainBridge, signatureReward } = await setupBridge(
        testContext.client,
      )
      const initialBalance = Number(
        await getXRPBalance(testContext.client, xchainBridge.LockingChainDoor),
      )

      // actually test XChainAccountCreateCommit
      const wallet2 = await generateFundedWallet(testContext.client)
      const destination = Wallet.generate()
      const amount = 10000000
      const tx: XChainAccountCreateCommit = {
        TransactionType: 'XChainAccountCreateCommit',
        Account: wallet2.classicAddress,
        XChainBridge: xchainBridge,
        Amount: amount.toString(),
        SignatureReward: signatureReward,
        Destination: destination.classicAddress,
      }

      await testTransaction(testContext.client, tx, wallet2)

      const accountInfoResponse2 = await testContext.client.request({
        command: 'account_info',
        account: xchainBridge.LockingChainDoor,
      })
      const finalBalance = Number(
        accountInfoResponse2.result.account_data.Balance,
      )
      assert.equal(
        finalBalance,
        initialBalance + amount + Number(signatureReward),
        "The bridge door's balance should go up by the amount committed",
      )
    },
    TIMEOUT,
  )
})
