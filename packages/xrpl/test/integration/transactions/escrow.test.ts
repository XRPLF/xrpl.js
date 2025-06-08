import { assert } from 'chai'

import { EscrowFinish, EscrowCreate, EscrowCancel, Wallet } from '../../../src'
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

describe('Escrow', function () {
  let testContext: XrplIntegrationTestContext
  let wallet1: Wallet

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet1 = await generateFundedWallet(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  async function closeLedgers(count: number): Promise<void> {
    for (let _i = 0; _i < count; _i++) {
      // eslint-disable-next-line no-await-in-loop -- okay here
      await sendLedgerAccept(testContext.client)
    }
  }

  it(
    'finish escrow',
    async () => {
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

  it(
    'finish function',
    async () => {
      const FINISH_FUNCTION =
        '0061736d010000000105016000017f02190108686f73745f6c69620c6765' +
        '744c656467657253716e00000302010005030100100611027f00418080c0' +
        '000b7f00418080c0000b072e04066d656d6f727902000666696e69736800' +
        '010a5f5f646174615f656e6403000b5f5f686561705f6261736503010a09' +
        '010700100041044a0b004d0970726f64756365727302086c616e67756167' +
        '65010452757374000c70726f6365737365642d6279010572757374631d31' +
        '2e38352e31202834656231363132353020323032352d30332d3135290049' +
        '0f7461726765745f6665617475726573042b0f6d757461626c652d676c6f' +
        '62616c732b087369676e2d6578742b0f7265666572656e63652d74797065' +
        '732b0a6d756c746976616c7565'

      // get the most recent close_time from the standalone container for cancel & finish after.
      const CLOSE_TIME = await getLedgerCloseTime(testContext.client)

      const AMOUNT = 10000

      const createTx: EscrowCreate = {
        Account: testContext.wallet.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: AMOUNT.toString(),
        Destination: wallet1.classicAddress,
        FinishFunction: FINISH_FUNCTION,
        CancelAfter: CLOSE_TIME + 200,
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
        ComputationAllowance: 5,
      }

      await testTransaction(testContext.client, finishTx, testContext.wallet)

      const expectedBalance = String(Number(initialBalance) + Number(AMOUNT))
      assert.equal(
        await getXRPBalance(testContext.client, wallet1),
        expectedBalance,
      )
    },
    TIMEOUT,
  )
})
