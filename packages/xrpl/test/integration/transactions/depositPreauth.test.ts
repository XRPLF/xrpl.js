import _ from 'lodash'
import { DepositPreauth, Wallet } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { fundAccount, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DepositPreauth', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = Wallet.generate()
    fundAccount(this.client, wallet2)
    const tx: DepositPreauth = {
      TransactionType: 'DepositPreauth',
      Account: this.wallet.classicAddress,
      Authorize: wallet2.classicAddress,
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
