import { assert } from 'chai'
import _ from 'lodash'
import { Payment } from 'xrpl-local'

import serverUrl from './serverUrl'
import { setupClient, teardownClient } from './setup'
import { generateFundedWallet } from './utils'

// how long before each test case times out
const TIMEOUT = 1200000

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

    const result = await this.client.submitAndWaitBatch(txList)
    assert.equal(result.success.length, 2)

    /*
     * for (const response of result) {
     *   // check that the transaction was successful
     *   assert.equal(response.type, 'response')
     *   assert.equal(
     *     response.result.engine_result,
     *     'tesSUCCESS',
     *     response.result.engine_result_message,
     *   )
     * }
     */
  })

  /*
   * it('should throw a ValidationError when submitting an unsigned transaction without a wallet', async function () {
   *   const accountSet: AccountSet = {
   *     TransactionType: 'AccountSet',
   *     Account: this.wallet.classicAddress,
   *     Domain: convertStringToHex('example.com'),
   *   }
   *   const txList = [accountSet]
   */

  /*
   *   await assertRejects(
   *     this.client.submitAndWaitBatch(txList),
   *     ValidationError,
   *     'Wallet must be provided when submitting an unsigned transaction',
   *   )
   * })
   */
})
