import _ from 'lodash'
import { AccountSet } from 'xrpl-local/models/transactions'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountSet', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const tx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
