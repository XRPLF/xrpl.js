import _ from 'lodash'

import { PaymentChannelCreate, hashes, PaymentChannelClaim } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000
const { hashPaymentChannel } = hashes

describe('PaymentChannelClaim', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const paymentChannelCreate: PaymentChannelCreate = {
      TransactionType: 'PaymentChannelCreate',
      Account: this.wallet.classicAddress,
      Amount: '100',
      Destination: wallet2.classicAddress,
      SettleDelay: 86400,
      PublicKey: this.wallet.publicKey,
    }

    const paymentChannelResponse = await this.client.submit(
      this.wallet,
      paymentChannelCreate,
    )

    await testTransaction(this.client, paymentChannelCreate, this.wallet)

    const paymentChannelClaim: PaymentChannelClaim = {
      Account: this.wallet.classicAddress,
      TransactionType: 'PaymentChannelClaim',
      Channel: hashPaymentChannel(
        this.wallet.classicAddress,
        wallet2.classicAddress,
        paymentChannelResponse.result.tx_json.Sequence ?? 0,
      ),
      Amount: '100',
    }

    await testTransaction(this.client, paymentChannelClaim, this.wallet)
  })
})
