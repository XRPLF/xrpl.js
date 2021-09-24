import _ from 'lodash'

import { TrustSet } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('TrustSet', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const tx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.wallet.getClassicAddress(),
      LimitAmount: {
        currency: 'USD',
        issuer: wallet2.getClassicAddress(),
        value: '100',
      },
    }

    await testTransaction(this.client, tx, this.wallet)
  })
})
