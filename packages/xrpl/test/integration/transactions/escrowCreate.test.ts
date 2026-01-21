import { assert } from 'chai'

import {
  AccountSet,
  AccountSetAsfFlags,
  TrustSet,
  Payment,
  EscrowFinish,
  EscrowCreate,
  EscrowCancel,
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
          value: '111',
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

      // Step-7: Execute the EscrowFinish transaction
      const escrowFinishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: escrowSourceWallet.classicAddress,
        Owner: escrowSourceWallet.classicAddress,
        OfferSequence: Number(txnResponse.result.tx_json.Sequence),
      }

      // Step 7.1: wait for the escrow to be ready to finish
      await waitForAndForceProgressLedgerTime(
        testContext.client,
        CLOSE_TIME + 2,
      )

      // Step 7.2: rippled uses the close time of the previous ledger
      await sendLedgerAccept(testContext.client)

      // Step 7.3: execute the EscrowFinish transaction
      await testTransaction(
        testContext.client,
        escrowFinishTx,
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
      await waitForAndForceProgressLedgerTime(
        testContext.client,
        CLOSE_TIME + 4,
      )

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
