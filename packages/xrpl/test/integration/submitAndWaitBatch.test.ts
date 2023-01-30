/* eslint-disable @typescript-eslint/no-misused-promises -- supposed to return a promise here */
/* eslint-disable no-restricted-syntax -- not sure why this rule is here, definitely not needed here */
import { assert } from 'chai'
import _ from 'lodash'
import { Payment } from 'xrpl-local'

import serverUrl from './serverUrl'
import { setupClient, teardownClient } from './setup'
import { generateFundedWallet, ledgerAccept } from './utils'

// how long before each test case times out
const TIMEOUT = 60000

describe('client.submitAndWaitBatch', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('submitAndWaitBatch a single account submits one payment transaction', async function () {
    const receiverWallet = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet.classicAddress,
      Amount: '1000',
    }
    const txList = [
      {
        transaction: paymentTx,
        opts: { wallet: this.wallet },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([result, _ledger]) => {
        assert.equal(result.success.length, 1)
        assert.equal(result.error.length, 0)
        assert.equal(result.unsubmitted.length, 0)
        assert.equal(result.success[0].type, 'response')
        assert.equal(result.success[0].result.validated, true)
      },
    )
  })

  it('submitAndWaitBatch a single account submits one failed transaction', async function () {
    const invalidAccountDeleteTx = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.classicAddress,
      Destination: this.wallet.classicAddress,
      Amount: '1000',
    }
    const txList = [
      {
        transaction: invalidAccountDeleteTx,
        opts: { wallet: this.wallet },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([result, _ledger]) => {
        assert.equal(result.success.length, 0)
        assert.equal(result.error.length, 1)
        assert.equal(result.unsubmitted.length, 0)
        assert.equal(result.error[0].data.error, 'invalidTransaction')
        assert.equal(result.error[0].data.status, 'error')
      },
    )
  })

  it('submitAndWaitBatch a single account submits multiple payment transactions', async function () {
    const receiverWallet = await generateFundedWallet(this.client)
    const receiverWallet2 = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet.classicAddress,
      Amount: '1000',
    }
    const paymentTx2: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet2.classicAddress,
      Amount: '1000',
    }
    const txList = [
      {
        transaction: paymentTx,
        opts: { wallet: this.wallet },
      },
      {
        transaction: paymentTx2,
        opts: { wallet: this.wallet },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 2)
        assert.equal(result.error.length, 0)
        assert.equal(result.unsubmitted.length, 0)
        for (const response of result.success) {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        }
      },
    )
  })

  it('submitAndWaitBatch a single account submits multiple payment transactions with one failed transaction', async function () {
    const receiverWallet = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet.classicAddress,
      Amount: '1000',
    }
    const invalidAccountDeleteTx = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.classicAddress,
      Destination: this.wallet.classicAddress,
      Amount: '1000',
    }
    const txList = [
      {
        transaction: paymentTx,
        opts: { wallet: this.wallet },
      },
      {
        transaction: invalidAccountDeleteTx,
        opts: { wallet: this.wallet },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 1)
        assert.equal(result.error.length, 1)
        assert.equal(result.unsubmitted.length, 0)
        assert.equal(result.success[0].type, 'response')
        assert.equal(result.success[0].result.validated, true)
        assert.equal(result.error[0].data.error, 'invalidTransaction')
        assert.equal(result.error[0].data.status, 'error')
      },
    )
  })

  it('submitAndWaitBatch multiple accounts submit one payment transaction', async function () {
    const receiverWallet = await generateFundedWallet(this.client)
    const senderWallet2 = await generateFundedWallet(this.client)
    const receiverWallet2 = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
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
        opts: { wallet: this.wallet },
      },
      {
        transaction: paymentTx2,
        opts: { wallet: senderWallet2 },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 2)
        assert.equal(result.error.length, 0)
        assert.equal(result.unsubmitted.length, 0)
        for (const response of result.success) {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        }
      },
    )
  })

  it('submitAndWaitBatch multiple accounts submit one failed transaction', async function () {
    const senderWallet2 = await generateFundedWallet(this.client)

    const invalidAccountDeleteTx = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.classicAddress,
      Destination: this.wallet.classicAddress,
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
        opts: { wallet: this.wallet },
      },
      {
        transaction: invalidAccountDeleteTx2,
        opts: { wallet: senderWallet2 },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 0)
        assert.equal(result.error.length, 2)
        assert.equal(result.unsubmitted.length, 0)
        for (const response of result.error) {
          assert.equal(response.data.error, 'invalidTransaction')
          assert.equal(response.data.status, 'error')
        }
      },
    )
  })

  it('submitAndWaitBatch multiple accounts submit multiple payment transactions', async function () {
    const receiverWallet = await generateFundedWallet(this.client)
    const receiverWallet2 = await generateFundedWallet(this.client)
    const senderWallet2 = await generateFundedWallet(this.client)
    const receiverWallet3 = await generateFundedWallet(this.client)
    const receiverWallet4 = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet.classicAddress,
      Amount: '1000',
    }
    const paymentTx2: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
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
        opts: { wallet: this.wallet },
      },
      {
        transaction: paymentTx2,
        opts: { wallet: this.wallet },
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

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 4)
        assert.equal(result.error.length, 0)
        assert.equal(result.unsubmitted.length, 0)
        for (const response of result.success) {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        }
      },
    )
  })

  it('submitAndWaitBatch multiple accounts submit multiple payment transactions with one failed transaction', async function () {
    const receiverWallet = await generateFundedWallet(this.client)
    const senderWallet2 = await generateFundedWallet(this.client)
    const receiverWallet2 = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet.classicAddress,
      Amount: '1000',
    }
    const invalidAccountDeleteTx = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.classicAddress,
      Destination: this.wallet.classicAddress,
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
        opts: { wallet: this.wallet },
      },
      {
        transaction: invalidAccountDeleteTx,
        opts: { wallet: this.wallet },
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

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 2)
        assert.equal(result.error.length, 2)
        assert.equal(result.unsubmitted.length, 0)
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
  })

  it("submitAndWaitBatch multiple accounts submit multiple payment transactions with one failed transaction and don't submit subsequent transactions", async function () {
    const receiverWallet = await generateFundedWallet(this.client)
    const receiverWallet2 = await generateFundedWallet(this.client)
    const senderWallet2 = await generateFundedWallet(this.client)
    const receiverWallet3 = await generateFundedWallet(this.client)
    const receiverWallet4 = await generateFundedWallet(this.client)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet.classicAddress,
      Amount: '1000',
    }
    const invalidAccountDeleteTx = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.classicAddress,
      Destination: this.wallet.classicAddress,
      Amount: '1000',
    }
    const paymentTx2: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.classicAddress,
      Destination: receiverWallet2.classicAddress,
      Amount: '1000',
    }
    const paymentTx3: Payment = {
      TransactionType: 'Payment',
      Account: senderWallet2.classicAddress,
      Destination: receiverWallet3.classicAddress,
      Amount: '1000',
    }
    const invalidAccountDeleteTx2 = {
      TransactionType: 'AccountDelete',
      Account: senderWallet2.classicAddress,
      Destination: senderWallet2.classicAddress,
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
        opts: { wallet: this.wallet },
      },
      {
        transaction: invalidAccountDeleteTx,
        opts: { wallet: this.wallet },
      },
      {
        transaction: paymentTx2,
        opts: { wallet: this.wallet },
      },
      {
        transaction: paymentTx3,
        opts: { wallet: senderWallet2 },
      },
      {
        transaction: invalidAccountDeleteTx2,
        opts: { wallet: senderWallet2 },
      },
      {
        transaction: paymentTx4,
        opts: { wallet: senderWallet2 },
      },
    ]

    const responsePromise = this.client.submitAndWaitBatch(txList)

    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    const ledgerPromise2 = setTimeout(ledgerAccept, 3000, this.client)
    return Promise.all([responsePromise, ledgerPromise, ledgerPromise2]).then(
      ([result, _ledger, _ledger2]) => {
        assert.equal(result.success.length, 2)
        assert.equal(result.error.length, 2)
        assert.equal(result.unsubmitted.length, 2)
        for (const response of result.success) {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        }
        for (const response of result.error) {
          assert.equal(response.data.error, 'invalidTransaction')
          assert.equal(response.data.status, 'error')
        }
        assert.equal(result.unsubmitted[0].transaction, paymentTx2)
        assert.equal(result.unsubmitted[1].transaction, paymentTx4)
      },
    )
  })
})
