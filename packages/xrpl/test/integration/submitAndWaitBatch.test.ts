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

  it('submitAndWaitBatch a set of payment transactions', async function () {
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
        for (const response of result.success) {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        }
      },
    )
  })
})
