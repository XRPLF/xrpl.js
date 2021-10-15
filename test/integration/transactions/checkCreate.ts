import { assert } from 'chai'
import _ from 'lodash'

import { CheckCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('CheckCreate', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const tx: CheckCreate = {
      TransactionType: 'CheckCreate',
      Account: this.wallet.getClassicAddress(),
      Destination: wallet2.getClassicAddress(),
      SendMax: '50',
    }

    await testTransaction(this.client, tx, this.wallet)

    // confirm that the check actually went through
    const accountOffersResponse = await this.client.request({
      command: 'account_objects',
      account: this.wallet.getClassicAddress(),
      type: 'check',
    })
    assert.lengthOf(
      accountOffersResponse.result.account_objects,
      1,
      'Should be exactly one check on the ledger',
    )
  })
})
