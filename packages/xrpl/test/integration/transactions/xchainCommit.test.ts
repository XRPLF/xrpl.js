import { assert } from 'chai'

import { XChainCommit } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupBridge,
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, getXRPBalance, testTransaction } from '../utils'

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
      const { xchainBridge } = await setupBridge(testContext.client)

      const initialBalance = Number(
        await getXRPBalance(testContext.client, xchainBridge.LockingChainDoor),
      )

      // actually test XChainCommit
      const wallet2 = await generateFundedWallet(testContext.client)
      const amount = 10000000
      const tx: XChainCommit = {
        TransactionType: 'XChainCommit',
        Account: wallet2.classicAddress,
        XChainBridge: xchainBridge,
        XChainClaimID: 1,
        Amount: amount.toString(),
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
        initialBalance + amount,
        finalBalance,
        "The bridge door's balance should go up by the amount committed",
      )
    },
    TIMEOUT,
  )
})
