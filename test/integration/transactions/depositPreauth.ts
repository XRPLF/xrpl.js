import _ from 'lodash'

import { DepositPreauth, Wallet } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { fundAccount, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DepositPreauth', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = Wallet.generate()
    fundAccount(this.client, wallet2)
    const tx: DepositPreauth = {
      TransactionType: 'DepositPreauth',
      Account: this.wallet.getClassicAddress(),
      Authorize: wallet2.getClassicAddress(),
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
