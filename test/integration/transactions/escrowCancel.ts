import { assert } from 'chai'
import _ from 'lodash'

import { EscrowCancel, EscrowCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet, getXRPBalance, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowCancel', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    // get the most recent close_time from the standalone container for cancel & finish after.
    const CLOSE_TIME: number = (
      await this.client.request({
        command: 'ledger',
        ledger_index: 'validated',
      })
    ).result.ledger.close_time
    const wallet1 = await generateFundedWallet(this.client)

    const createTx: EscrowCreate = {
      Account: this.wallet.getClassicAddress(),
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Destination: wallet1.getClassicAddress(),
      CancelAfter: CLOSE_TIME + 3,
      FinishAfter: CLOSE_TIME + 2,
    }

    await testTransaction(this.client, createTx, this.wallet)

    const initialBalanceWallet1 = await getXRPBalance(this.client, wallet1)

    // check that the object was actually created
    const accountObjects = (
      await this.client.request({
        command: 'account_objects',
        account: this.wallet.getClassicAddress(),
      })
    ).result.account_objects

    assert.equal(accountObjects.length, 1)

    const sequence = (
      await this.client.request({
        command: 'tx',
        transaction: accountObjects[0].PreviousTxnID,
      })
    ).result.Sequence

    const cancelTx: EscrowCancel = {
      TransactionType: 'EscrowCancel',
      Account: this.wallet.getClassicAddress(),
      Owner: this.wallet.getClassicAddress(),
      OfferSequence: sequence,
    }

    await testTransaction(this.client, cancelTx, this.wallet)

    assert.equal(
      await getXRPBalance(this.client, wallet1),
      initialBalanceWallet1,
    )
  })
})
