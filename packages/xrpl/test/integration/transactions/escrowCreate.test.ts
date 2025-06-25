import { assert } from 'chai'

import {
  AccountSet,
  AccountSetAsfFlags,
  TrustSet,
  Payment,
  EscrowFinish,
  EscrowCreate,
} from '../../../src'

import serverUrl from '../serverUrl'

import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

import {
  generateFundedWallet,
  testTransaction,
  sendLedgerAccept,
  waitForAndForceProgressLedgerTime,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowCreate', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)

      // get the most recent close_time from the standalone container for finish after.
      const CLOSE_TIME: number = (
        await testContext.client.request({
          command: 'ledger',
          ledger_index: 'validated',
        })
      ).result.ledger.close_time

      const tx: EscrowCreate = {
        Account: testContext.wallet.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: '10000',
        Destination: wallet2.classicAddress,
        FinishAfter: CLOSE_TIME + 2,
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // check that the object was actually created
      assert.equal(
        (
          await testContext.client.request({
            command: 'account_objects',
            account: testContext.wallet.classicAddress,
          })
        ).result.account_objects.length,
        1,
      )
    },
    TIMEOUT,
  )

  it(
    'escrow with IOU -- validate EscrowCreate and EscrowFinish transactions',
    async () => {
      const wallet1 = await generateFundedWallet(testContext.client)
      const wallet2 = await generateFundedWallet(testContext.client)

      // Step-1: configure Issuer (testContext.wallet.classicAddress) to allow their IOUs to be used as escrow amounts
      const setupAccountSetTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfAllowTrustLineLocking,
      }
      await testTransaction(
        testContext.client,
        setupAccountSetTx,
        testContext.wallet,
      )

      // Step-2: setup appropriate trust lines to transfer the IOU.
      // This is needed for both wallet1 and wallet2 to hold the USD IOU token.
      const setupTrustSetTx_1: TrustSet = {
        TransactionType: 'TrustSet',
        Account: wallet1.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(testContext.client, setupTrustSetTx_1, wallet1)

      const setupTrustSetTx_2: TrustSet = {
        TransactionType: 'TrustSet',
        Account: wallet2.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(testContext.client, setupTrustSetTx_2, wallet2)

      // Step-3: transfer the USD IOU token to from Issuer to wallet1
      const setupPaymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: wallet1.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(
        testContext.client,
        setupPaymentTx,
        testContext.wallet,
      )

      // Step-4: create the escrow
      // get the most recent close_time from the standalone container for finish after.
      const CLOSE_TIME: number = (
        await testContext.client.request({
          command: 'ledger',
          ledger_index: 'validated',
        })
      ).result.ledger.close_time

      const tx: EscrowCreate = {
        Account: wallet1.classicAddress,
        TransactionType: 'EscrowCreate',
        Amount: {
          currency: 'USD',
          value: '100',
          issuer: testContext.wallet.classicAddress,
        },
        Destination: wallet2.classicAddress,
        FinishAfter: CLOSE_TIME + 2,
        CancelAfter: CLOSE_TIME + 4,
      }

      const txn_response = await testTransaction(
        testContext.client,
        tx,
        wallet1,
      )

      // Step-5: fetch the escrow object
      const wallet1_objects = await testContext.client.request({
        command: 'account_objects',
        account: wallet1.classicAddress,
        type: 'escrow',
      })
      assert.equal(wallet1_objects.result.account_objects.length, 1)

      // Step-6: check that the escrow object has the correct particulars
      const escrowObject = wallet1_objects.result.account_objects[0]
      assert.equal(escrowObject.LedgerEntryType, 'Escrow')
      assert.equal(escrowObject.PreviousTxnID, txn_response.result.tx_json.hash)

      // Step-7: Execute the EscrowFinish transaction
      const escrowFinishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: wallet1.classicAddress,
        Owner: wallet1.classicAddress,
        OfferSequence: Number(txn_response.result.tx_json.Sequence),
      }

      // Step 7.1: wait for the escrow to be ready to finish
      await waitForAndForceProgressLedgerTime(
        testContext.client,
        CLOSE_TIME + 2,
      )

      // Step 7.2: rippled uses the close time of the previous ledger
      await sendLedgerAccept(testContext.client)

      // Step 7.3: execute the EscrowFinish transaction
      await testTransaction(testContext.client, escrowFinishTx, wallet1)

      // Step 8: check that the escrow object has been removed
      const wallet1_objects_after_escrow_finish =
        await testContext.client.request({
          command: 'account_objects',
          account: wallet1.classicAddress,
          type: 'escrow',
        })
      assert.equal(
        wallet1_objects_after_escrow_finish.result.account_objects.length,
        0,
      )
    },
    TIMEOUT,
  )
})
