/* eslint-disable mocha/no-hooks-for-single-case -- Use of hooks is restricted when there is a single test case. */
import _ from 'lodash'

import { AccountDelete } from 'xrpl-local/models/transactions'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { getMasterAccount, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountDelete', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const tx: AccountDelete = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.getClassicAddress(),
      Destination: getMasterAccount(),
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
