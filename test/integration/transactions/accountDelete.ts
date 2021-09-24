import _ from 'lodash'

import { AccountDelete } from 'xrpl-local/models/transactions'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet, ledgerAccept, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountDelete', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet = await generateFundedWallet(this.client)
    const promises: Array<Promise<void>> = []
    for (let iter = 0; iter < 256; iter += 1) {
      promises.push(ledgerAccept(this.client))
    }

    await Promise.all(promises)
    const tx: AccountDelete = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.getClassicAddress(),
      Destination: wallet.getClassicAddress(),
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
