import { assert } from 'chai'
import { EscrowCancel, EscrowCreate, unixTimeToRippleTime } from 'xrpl-local'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, getXRPBalance, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 30000

describe('EscrowCancel', () => {
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

      // Attempt to get the time after which we can check for the escrow to be finished.
      // Sometimes the ledger close_time is in the future, so we need to wait for it to catch up.
      const currentTimeUnix = Math.floor(new Date().getTime())
      const currentTimeRipple = unixTimeToRippleTime(currentTimeUnix)
      const closeTimeCurrentTimeDiff = currentTimeRipple - CLOSE_TIME
      let waitTimeInMs = Math.min(
        Math.abs(closeTimeCurrentTimeDiff) * 1000 + 5000,
        // Maximum wait time of 20 seconds
        20000,
      )
      waitTimeInMs = waitTimeInMs < 5000 ? 5000 : waitTimeInMs

      const createTx: EscrowCreate = {
        Account: testContext.wallet.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: '10000',
        Destination: wallet1.classicAddress,
        CancelAfter: CLOSE_TIME + 3,
        FinishAfter: CLOSE_TIME + 2,
      }

      await testTransaction(testContext.client, createTx, testContext.wallet)

      const initialBalanceWallet1 = await getXRPBalance(
        testContext.client,
        wallet1,
      )

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
      const threeSecondCancelAfterTimerPromise = new Promise((resolve) => {
        setTimeout(resolve, waitTimeInMs)
      })

      // Make sure we waited at least 3 seconds before canceling the escrow.
      await threeSecondCancelAfterTimerPromise

      await testTransaction(testContext.client, cancelTx, testContext.wallet)

      // Make sure the Destination wallet did not receive any XRP.
      assert.equal(
        await getXRPBalance(testContext.client, wallet1),
        initialBalanceWallet1,
      )
    },
    TIMEOUT,
  )
})
