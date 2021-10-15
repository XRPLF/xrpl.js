import { assert } from 'chai'
import _ from 'lodash'

import { EscrowCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowCreate', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    // get the most recent close_time from the standalone container for finish after.
    const CLOSE_TIME: number = (
      await this.client.request({
        command: 'ledger',
        ledger_index: 'validated',
      })
    ).result.ledger.close_time

    const wallet1 = await generateFundedWallet(this.client)
    const tx: EscrowCreate = {
      Account: this.wallet.getClassicAddress(),
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Destination: wallet1.getClassicAddress(),
      FinishAfter: CLOSE_TIME + 2,
    }

    await testTransaction(this.client, tx, this.wallet)

    // check that the object was actually created
    assert.equal(
      (
        await this.client.request({
          command: 'account_objects',
          account: this.wallet.getClassicAddress(),
        })
      ).result.account_objects.length,
      1,
    )
  })
})
