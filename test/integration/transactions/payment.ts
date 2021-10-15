import _ from 'lodash'

import { Payment } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Payment', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.getClassicAddress(),
      Destination: wallet2.getClassicAddress(),
      Amount: '1000',
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
