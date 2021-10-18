import { assert } from 'chai'
import _ from 'lodash'

import { CheckCreate, CheckCash } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('CheckCash', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const amount = '500'

    const setupTx: CheckCreate = {
      TransactionType: 'CheckCreate',
      Account: this.wallet.classicAddress,
      Destination: wallet2.classicAddress,
      SendMax: amount,
    }

    await testTransaction(this.client, setupTx, this.wallet)

    // get check ID
    const response1 = await this.client.request({
      command: 'account_objects',
      account: this.wallet.classicAddress,
      type: 'check',
    })
    assert.lengthOf(
      response1.result.account_objects,
      1,
      'Should be exactly one check on the ledger',
    )
    const checkId = response1.result.account_objects[0].index

    // actual test - cash the check
    const tx: CheckCash = {
      TransactionType: 'CheckCash',
      Account: wallet2.classicAddress,
      CheckID: checkId,
      Amount: amount,
    }

    await testTransaction(this.client, tx, wallet2)

    // confirm that the check no longer exists
    const accountOffersResponse = await this.client.request({
      command: 'account_objects',
      account: this.wallet.classicAddress,
      type: 'check',
    })
    assert.lengthOf(
      accountOffersResponse.result.account_objects,
      0,
      'Should be no checks on the ledger',
    )
  })
})
