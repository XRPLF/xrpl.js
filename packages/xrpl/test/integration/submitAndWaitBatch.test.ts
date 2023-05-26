import { assert } from 'chai'
import _ from 'lodash'

import { Payment } from '../../src'

import serverUrl from './serverUrl'
import {
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
} from './setup'
import { delayedLedgerAccept, generateFundedWallet } from './utils'

// how long before each test case times out
const TIMEOUT = 60000

describe('client.submitAndWaitBatch', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'submitAndWaitBatch a single account submits one payment transaction',
    async function () {
      const receiverWallet = await generateFundedWallet(testContext.client)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: paymentTx,
          opts: { wallet: testContext.wallet },
        },
      ]

      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 1)
          assert.equal(result.error.length, 0)
          assert.equal(result.success[0].type, 'response')
          assert.equal(result.success[0].result.validated, true)
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch a single account submits one failed transaction',
    async function () {
      const invalidAccountDeleteTx = {
        TransactionType: 'AccountDelete',
        Account: testContext.wallet.classicAddress,
        Destination: testContext.wallet.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: invalidAccountDeleteTx,
          opts: { wallet: testContext.wallet },
        },
      ]

      // @ts-expect-error -- valid for this test
      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 0)
          assert.equal(result.error.length, 1)
          assert.equal(result.error[0].data.error, 'invalidTransaction')
          assert.equal(result.error[0].data.status, 'error')
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch a single account submits multiple payment transactions',
    async function () {
      const receiverWallet = await generateFundedWallet(testContext.client)
      const receiverWallet2 = await generateFundedWallet(testContext.client)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet.classicAddress,
        Amount: '1000',
      }
      const paymentTx2: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet2.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: paymentTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: paymentTx2,
          opts: { wallet: testContext.wallet },
        },
      ]

      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 2)
          assert.equal(result.error.length, 0)
          for (const response of result.success) {
            assert.equal(response.type, 'response')
            assert.equal(response.result.validated, true)
          }
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch a single account submits multiple payment transactions with one failed transaction',
    async function () {
      const receiverWallet = await generateFundedWallet(testContext.client)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet.classicAddress,
        Amount: '1000',
      }
      const invalidAccountDeleteTx = {
        TransactionType: 'AccountDelete',
        Account: testContext.wallet.classicAddress,
        Destination: testContext.wallet.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: paymentTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: invalidAccountDeleteTx,
          opts: { wallet: testContext.wallet },
        },
      ]

      // @ts-expect-error -- valid for this test
      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 1)
          assert.equal(result.error.length, 1)
          assert.equal(result.success[0].type, 'response')
          assert.equal(result.success[0].result.validated, true)
          assert.equal(result.error[0].data.error, 'invalidTransaction')
          assert.equal(result.error[0].data.status, 'error')
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch multiple accounts submit one payment transaction',
    async function () {
      const receiverWallet = await generateFundedWallet(testContext.client)
      const senderWallet2 = await generateFundedWallet(testContext.client)
      const receiverWallet2 = await generateFundedWallet(testContext.client)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet.classicAddress,
        Amount: '1000',
      }
      const paymentTx2: Payment = {
        TransactionType: 'Payment',
        Account: senderWallet2.classicAddress,
        Destination: receiverWallet2.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: paymentTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: paymentTx2,
          opts: { wallet: senderWallet2 },
        },
      ]

      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 2)
          assert.equal(result.error.length, 0)
          for (const response of result.success) {
            assert.equal(response.type, 'response')
            assert.equal(response.result.validated, true)
          }
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch multiple accounts submit one failed transaction',
    async function () {
      const senderWallet2 = await generateFundedWallet(testContext.client)

      const invalidAccountDeleteTx = {
        TransactionType: 'AccountDelete',
        Account: testContext.wallet.classicAddress,
        Destination: testContext.wallet.classicAddress,
        Amount: '1000',
      }
      const invalidAccountDeleteTx2 = {
        TransactionType: 'AccountDelete',
        Account: senderWallet2.classicAddress,
        Destination: senderWallet2.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: invalidAccountDeleteTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: invalidAccountDeleteTx2,
          opts: { wallet: senderWallet2 },
        },
      ]

      // @ts-expect-error -- valid for this test
      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 0)
          assert.equal(result.error.length, 2)
          for (const response of result.error) {
            assert.equal(response.data.error, 'invalidTransaction')
            assert.equal(response.data.status, 'error')
          }
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch multiple accounts submit multiple payment transactions',
    async function () {
      const receiverWallet = await generateFundedWallet(testContext.client)
      const receiverWallet2 = await generateFundedWallet(testContext.client)
      const senderWallet2 = await generateFundedWallet(testContext.client)
      const receiverWallet3 = await generateFundedWallet(testContext.client)
      const receiverWallet4 = await generateFundedWallet(testContext.client)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet.classicAddress,
        Amount: '1000',
      }
      const paymentTx2: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet2.classicAddress,
        Amount: '1000',
      }
      const paymentTx3: Payment = {
        TransactionType: 'Payment',
        Account: senderWallet2.classicAddress,
        Destination: receiverWallet3.classicAddress,
        Amount: '1000',
      }
      const paymentTx4: Payment = {
        TransactionType: 'Payment',
        Account: senderWallet2.classicAddress,
        Destination: receiverWallet4.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: paymentTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: paymentTx2,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: paymentTx3,
          opts: { wallet: senderWallet2 },
        },
        {
          transaction: paymentTx4,
          opts: { wallet: senderWallet2 },
        },
      ]

      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 4)
          assert.equal(result.error.length, 0)
          for (const response of result.success) {
            assert.equal(response.type, 'response')
            assert.equal(response.result.validated, true)
          }
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWaitBatch multiple accounts submit multiple payment transactions with one failed transaction',
    async function () {
      const receiverWallet = await generateFundedWallet(testContext.client)
      const senderWallet2 = await generateFundedWallet(testContext.client)
      const receiverWallet2 = await generateFundedWallet(testContext.client)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: receiverWallet.classicAddress,
        Amount: '1000',
      }
      const invalidAccountDeleteTx = {
        TransactionType: 'AccountDelete',
        Account: testContext.wallet.classicAddress,
        Destination: testContext.wallet.classicAddress,
        Amount: '1000',
      }
      const paymentTx2: Payment = {
        TransactionType: 'Payment',
        Account: senderWallet2.classicAddress,
        Destination: receiverWallet2.classicAddress,
        Amount: '1000',
      }
      const invalidAccountDeleteTx2 = {
        TransactionType: 'AccountDelete',
        Account: senderWallet2.classicAddress,
        Destination: senderWallet2.classicAddress,
        Amount: '1000',
      }
      const txList = [
        {
          transaction: paymentTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: invalidAccountDeleteTx,
          opts: { wallet: testContext.wallet },
        },
        {
          transaction: paymentTx2,
          opts: { wallet: senderWallet2 },
        },
        {
          transaction: invalidAccountDeleteTx2,
          opts: { wallet: senderWallet2 },
        },
      ]

      // @ts-expect-error -- valid for this test
      const responsePromise = testContext.client.submitAndWaitBatch(txList)

      const ledgerPromise = delayedLedgerAccept(testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([result, _ledger]) => {
          assert.equal(result.success.length, 2)
          assert.equal(result.error.length, 2)
          for (const response of result.success) {
            assert.equal(response.type, 'response')
            assert.equal(response.result.validated, true)
          }
          for (const response of result.error) {
            assert.equal(response.data.error, 'invalidTransaction')
            assert.equal(response.data.status, 'error')
          }
        },
      )
    },
    TIMEOUT,
  )
})
