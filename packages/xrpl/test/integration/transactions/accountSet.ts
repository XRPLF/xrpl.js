import { assert } from 'chai'
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

  it('unset a hash field', async function () {
    const emailHash = '98B4375E1D753E5B91627516F6D70977'
    const setTx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      EmailHash: emailHash,
    }
    await testTransaction(this.client, setTx, this.wallet)

    const setEmailHashResponse = await this.client.request({
      command: 'account_info',
      account: this.wallet.classicAddress,
    })

    assert.equal(
      setEmailHashResponse.result.account_data.EmailHash,
      emailHash,
      'EmailHash should be set correctly',
    )

    const unsetTx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      EmailHash: '',
    }
    await testTransaction(this.client, unsetTx, this.wallet)

    const unsetEmailHashResponse = await this.client.request({
      command: 'account_info',
      account: this.wallet.classicAddress,
    })

    assert.equal(
      unsetEmailHashResponse.result.account_data.EmailHash,
      undefined,
      'EmailHash should be unset correctly',
    )
  })
})
