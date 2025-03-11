import { assert } from 'chai'

import { EscrowFinish, EscrowCreate, EscrowCancel } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  getXRPBalance,
  sendLedgerAccept,
  testTransaction,
  getLedgerCloseTime,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 30000

describe('EscrowFinish', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  async function closeLedgers(count: number): Promise<void> {
    for (let _i = 0; _i < count; _i++) {
      // eslint-disable-next-line no-await-in-loop -- okay here
      await sendLedgerAccept(testContext.client)
    }
  }

  it(
    'finish escrow',
    async () => {
      const wallet1 = await generateFundedWallet(testContext.client)

      // get the most recent close_time from the standalone container for cancel & finish after.
      const CLOSE_TIME = await getLedgerCloseTime(testContext.client)

      const AMOUNT = 10000

      const createTx: EscrowCreate = {
        Account: testContext.wallet.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: AMOUNT.toString(),
        Destination: wallet1.classicAddress,
        FinishAfter: CLOSE_TIME + 2,
      }

      await testTransaction(testContext.client, createTx, testContext.wallet)

      const initialBalance = await getXRPBalance(testContext.client, wallet1)

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
      ).result.tx_json.Sequence

      const finishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: testContext.wallet.classicAddress,
        Owner: testContext.wallet.classicAddress,
        OfferSequence: sequence!,
      }

      // wait for the escrow to be ready to finish
      await closeLedgers(4)

      // rippled uses the close time of the previous ledger
      await sendLedgerAccept(testContext.client)
      await testTransaction(testContext.client, finishTx, testContext.wallet)

      const expectedBalance = String(Number(initialBalance) + Number(AMOUNT))
      assert.equal(
        await getXRPBalance(testContext.client, wallet1),
        expectedBalance,
      )
    },
    TIMEOUT,
  )

  it(
    'cancel escrow',
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
      ).result.tx_json.Sequence

      if (!sequence) {
        throw new Error('sequence did not exist')
      }

      const cancelTx: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: testContext.wallet.classicAddress,
        Owner: testContext.wallet.classicAddress,
        OfferSequence: sequence,
      }

      await closeLedgers(4)

      // rippled uses the close time of the previous ledger
      await sendLedgerAccept(testContext.client)
      await testTransaction(testContext.client, cancelTx, testContext.wallet, {
        count: 20,
        delayMs: 2000,
      })

      // Make sure the Destination wallet did not receive any XRP.
      assert.equal(
        await getXRPBalance(testContext.client, wallet1),
        initialBalanceWallet1,
      )
    },
    TIMEOUT,
  )
})
