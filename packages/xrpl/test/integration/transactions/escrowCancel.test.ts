import { assert } from 'chai'

import { EscrowCancel, EscrowCreate } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  // calculateWaitTimeForTransaction,
  generateFundedWallet,
  // getXRPBalance,
  testTransaction,
  submitTransaction,
} from '../utils'

// TODO: Fix these tests
// NOTE: Because ledger accept is called among multiple tests, the actual ledger close time is not
// accurate. It can end up very far into the future. This means that the CancelAfter timer can potentially
// need to wait for several minutes to be able to properly complete. Since we are not testing the functionaity
// of rippled in this library, only that we are submitting commands properly, we can just test that the EscrowCancel
// command was successfully received. If in the future we isolate tests to run on their own rippled instance,
// we can uncomment the code in this file to test that the escrow was actually cancelled.

// how long before each test case times out
const TIMEOUT = 50000

describe('EscrowCancel', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      // Funding the wallet can take some time, so we do it first BEFORE getting the ledger close_time.
      const wallet1 = await generateFundedWallet(testContext.client)

      // get the most recent close_time from the standalone container for cancel & finish after.
      const CLOSE_TIME: number = (
        await testContext.client.request({
          command: 'ledger',
          ledger_index: 'validated',
        })
      ).result.ledger.close_time

      // const waitTimeInMs = calculateWaitTimeForTransaction(CLOSE_TIME)

      const createTx: EscrowCreate = {
        Account: testContext.wallet.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: '10000',
        Destination: wallet1.classicAddress,
        CancelAfter: CLOSE_TIME + 3,
        FinishAfter: CLOSE_TIME + 2,
      }

      await testTransaction(testContext.client, createTx, testContext.wallet)

      // const initialBalanceWallet1 = await getXRPBalance(
      //   testContext.client,
      //   wallet1,
      // )

      // check that the object was actually created
      const accountObjects = (
        await testContext.client.request({
          command: 'account_objects',
          account: testContext.wallet.classicAddress,
        })
      ).result.account_objects

      assert.equal(accountObjects.length, 1)

      const sequence = (
        await testContext.client.request({
          command: 'tx',
          transaction: accountObjects[0].PreviousTxnID,
        })
      ).result.Sequence

      if (!sequence) {
        throw new Error('sequence did not exist')
      }

      const cancelTx: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: testContext.wallet.classicAddress,
        Owner: testContext.wallet.classicAddress,
        OfferSequence: sequence,
      }

      // We set the CancelAfter timer to be 3 seconds after the last ledger close_time. We need to wait this long
      // before we can cancel the escrow.
      // const cancelAfterTimerPromise = new Promise((resolve) => {
      //   setTimeout(resolve, waitTimeInMs)
      // })

      // Make sure we wait long enough before canceling the escrow.
      // await cancelAfterTimerPromise

      // await testTransaction(testContext.client, cancelTx, testContext.wallet, {
      //   count: 20,
      //   delayMs: 2000,
      // })

      await submitTransaction({
        client: testContext.client,
        transaction: cancelTx,
        wallet: testContext.wallet,
      })

      // Make sure the Destination wallet did not receive any XRP.
      // assert.equal(
      //   await getXRPBalance(testContext.client, wallet1),
      //   initialBalanceWallet1,
      // )
    },
    TIMEOUT,
  )
})
