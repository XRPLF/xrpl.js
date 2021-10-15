import _ from 'lodash'

import { PaymentChannelCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('PaymentChannelCreate', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const paymentChannelCreate: PaymentChannelCreate = {
      TransactionType: 'PaymentChannelCreate',
      Account: this.wallet.getClassicAddress(),
      Amount: '100',
      Destination: wallet2.getClassicAddress(),
      SettleDelay: 86400,
      PublicKey: this.wallet.publicKey,
    }

    await testTransaction(this.client, paymentChannelCreate, this.wallet)
  })
})
