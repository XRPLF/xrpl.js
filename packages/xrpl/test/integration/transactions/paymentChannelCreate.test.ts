import _ from 'lodash'
import { PaymentChannelCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('PaymentChannelCreate', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl, true))
  afterEach(teardownClient)

  it('xrp test', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const paymentChannelCreate: PaymentChannelCreate = {
      TransactionType: 'PaymentChannelCreate',
      Account: this.wallet.classicAddress,
      Amount: '100',
      Destination: wallet2.classicAddress,
      SettleDelay: 86400,
      PublicKey: this.wallet.publicKey,
    }

    await testTransaction(this.client, paymentChannelCreate, this.wallet)
  })
  it('token test', async function () {
    const paymentChannelCreate: PaymentChannelCreate = {
      TransactionType: 'PaymentChannelCreate',
      Account: this.wallet.classicAddress,
      Amount: {
        currency: 'USD',
        issuer: this.gateway.classicAddress,
        value: '100',
      },
      Destination: this.destination.classicAddress,
      SettleDelay: 86400,
      PublicKey: this.wallet.publicKey,
    }
    await testTransaction(this.client, paymentChannelCreate, this.wallet)
  })
})
