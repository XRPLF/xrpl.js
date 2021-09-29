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
    const wallet2 = await generateFundedWallet(this.client)
    // to the satisfy the condition that account sequence and current ledger_index should be 256 apart.
    const promises: Array<Promise<void>> = []
    for (let iter = 0; iter < 256; iter += 1) {
      promises.push(ledgerAccept(this.client))
    }

    await Promise.all(promises)
    const tx: AccountDelete = {
      TransactionType: 'AccountDelete',
      Account: this.wallet.getClassicAddress(),
      Destination: wallet2.getClassicAddress(),
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
