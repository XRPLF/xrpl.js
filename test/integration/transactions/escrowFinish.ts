import { assert } from 'chai'
import _ from 'lodash'

import { EscrowFinish, EscrowCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, getXRPBalance, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowFinish', function () {
  this.timeout(TIMEOUT)

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

    const AMOUNT = 10000

    const createTx: EscrowCreate = {
      Account: this.wallet.getClassicAddress(),
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Destination: wallet1.getClassicAddress(),
      FinishAfter: CLOSE_TIME + 2,
    }

    await testTransaction(this.client, createTx, this.wallet)

    const initialBalance = await getXRPBalance(this.client, wallet1)

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

    const finishTx: EscrowFinish = {
      TransactionType: 'EscrowFinish',
      Account: this.wallet.getClassicAddress(),
      Owner: this.wallet.getClassicAddress(),
      OfferSequence: sequence,
    }

    await testTransaction(this.client, finishTx, this.wallet)

    const expectedBalance = String(Number(initialBalance) + Number(AMOUNT))
    assert.equal(await getXRPBalance(this.client, wallet1), expectedBalance)
  })
})
