import { assert } from 'chai'
import _ from 'lodash'
import {
  AccountSet,
  convertStringToHex,
  Payment,
  ValidationError,
} from 'xrpl-local'

import { assertRejects } from '../testUtils'

import serverUrl from './serverUrl'
import { setupClient, teardownClient } from './setup'
import { generateFundedWallet } from './utils'

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
    const txList = [paymentTx, paymentTx2]

    const responsePromises = await this.client.submitAndWaitBatch(txList, {
      wallet: this.wallet,
    })

    for (const response of responsePromises) {
      // check that the transaction was successful
      assert.equal(response.type, 'response')
      assert.equal(
        response.result.engine_result,
        'tesSUCCESS',
        response.result.engine_result_message,
      )
    }
  })

  it('should throw a ValidationError when submitting an unsigned transaction without a wallet', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
    const txList = [accountSet]

    await assertRejects(
      this.client.submitAndWaitBatch(txList),
      ValidationError,
      'Wallet must be provided when submitting an unsigned transaction',
    )
  })
})
