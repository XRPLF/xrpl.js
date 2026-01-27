import { assert } from 'chai'

import {
  EscrowFinish,
  EscrowCreate,
  EscrowCancel,
  Wallet,
  AccountSet,
  AccountSetAsfFlags,
  Payment,
  TrustSet,
} from '../../../src'
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
        '0061736d010000000108026000017f60000002160103656e760e6765745f6c65646765725f' +
        '73716e000003030201000503010002063e0a7f004180080b7f004180080b7f004180100b7f' +
        '004180100b7f00418090040b7f004180080b7f00418090040b7f00418080080b7f0041000b' +
        '7f0041010b07b0010d066d656d6f72790200115f5f7761736d5f63616c6c5f63746f727300' +
        '010666696e69736800020362756603000c5f5f64736f5f68616e646c6503010a5f5f646174' +
        '615f656e6403020b5f5f737461636b5f6c6f7703030c5f5f737461636b5f6869676803040d' +
        '5f5f676c6f62616c5f6261736503050b5f5f686561705f6261736503060a5f5f686561705f' +
        '656e6403070d5f5f6d656d6f72795f6261736503080c5f5f7461626c655f6261736503090a' +
        '150202000b1001017f100022004100200041044b1b0b007f0970726f647563657273010c70' +
        '726f6365737365642d62790105636c616e675f31392e312e352d776173692d73646b202868' +
        '747470733a2f2f6769746875622e636f6d2f6c6c766d2f6c6c766d2d70726f6a6563742061' +
        '62346235613264623538323935386166316565333038613739306366646234326264323437' +
        '32302900490f7461726765745f6665617475726573042b0f6d757461626c652d676c6f6261' +
        '6c732b087369676e2d6578742b0f7265666572656e63652d74797065732b0a6d756c746976' +
        '616c7565'

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
        ComputationAllowance: 20000,
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

  it(
    'escrow with IOU -- validate EscrowCancel transaction (Identical to previous test, except for Step 7-8)',
    async () => {
      const escrowSourceWallet = await generateFundedWallet(testContext.client)
      const escrowDestinationWallet = await generateFundedWallet(
        testContext.client,
      )

      const issuerWallet = testContext.wallet

      // Step-1: configure issuerWallet (testContext.wallet.classicAddress) to allow their IOUs to be used as escrow amounts
      const setupAccountSetTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: issuerWallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfAllowTrustLineLocking,
      }
      await testTransaction(testContext.client, setupAccountSetTx, issuerWallet)

      // Step-2: setup appropriate trust lines to transfer the IOU.
      // This is needed for both escrowSourceWallet and escrowDestinationWallet to hold the USD IOU token.
      const setupTrustSetTx1: TrustSet = {
        TransactionType: 'TrustSet',
        Account: escrowSourceWallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: issuerWallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(
        testContext.client,
        setupTrustSetTx1,
        escrowSourceWallet,
      )

      const setupTrustSetTx2: TrustSet = {
        TransactionType: 'TrustSet',
        Account: escrowDestinationWallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: issuerWallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(
        testContext.client,
        setupTrustSetTx2,
        escrowDestinationWallet,
      )

      // Step-3: transfer the USD IOU token to from Issuer to escrowSourceWallet
      const setupPaymentTx: Payment = {
        TransactionType: 'Payment',
        Account: issuerWallet.classicAddress,
        Destination: escrowSourceWallet.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: issuerWallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(testContext.client, setupPaymentTx, issuerWallet)

      // Step-4: create the escrow
      // get the most recent close_time from the standalone container for finish after.
      const CLOSE_TIME: number = (
        await testContext.client.request({
          command: 'ledger',
          ledger_index: 'validated',
        })
      ).result.ledger.close_time

      const tx: EscrowCreate = {
        Account: escrowSourceWallet.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: {
          currency: 'USD',
          value: '100',
          issuer: issuerWallet.classicAddress,
        },
        Destination: escrowDestinationWallet.classicAddress,
        FinishAfter: CLOSE_TIME + 2,
        CancelAfter: CLOSE_TIME + 4,
      }

      const txnResponse = await testTransaction(
        testContext.client,
        tx,
        escrowSourceWallet,
      )

      // Step-5: fetch the escrow object
      const wallet1Objects = await testContext.client.request({
        command: 'account_objects',
        account: escrowSourceWallet.classicAddress,
        type: 'escrow',
      })
      assert.equal(wallet1Objects.result.account_objects.length, 1)

      // Step-6: check that the escrow object has the correct particulars
      const escrowObject = wallet1Objects.result.account_objects[0]
      assert.equal(escrowObject.LedgerEntryType, 'Escrow')
      assert.equal(escrowObject.PreviousTxnID, txnResponse.result.tx_json.hash)

      // Step-7: Execute the EscrowCancel transaction
      const escrowCancelTx: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: escrowSourceWallet.classicAddress,
        Owner: escrowSourceWallet.classicAddress,
        OfferSequence: Number(txnResponse.result.tx_json.Sequence),
      }

      // Step 7.1: wait for the escrow to be "cancellable"
      await closeLedgers(4)

      // Step 7.2: rippled uses the close time of the previous ledger
      await sendLedgerAccept(testContext.client)

      // Step 7.3: execute the EscrowCancel transaction
      await testTransaction(
        testContext.client,
        escrowCancelTx,
        escrowSourceWallet,
      )

      // Step 8: check that the escrow object has been removed
      const escrowObjectsSourceWallet = await testContext.client.request({
        command: 'account_objects',
        account: escrowSourceWallet.classicAddress,
        type: 'escrow',
      })
      assert.equal(escrowObjectsSourceWallet.result.account_objects.length, 0)
    },
    TIMEOUT,
  )
})
