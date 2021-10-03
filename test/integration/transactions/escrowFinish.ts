import { assert } from 'chai'
import _ from 'lodash'

import { EscrowFinish, EscrowCreate, dropsToXrp } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet, getSequence, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowFinish', function () {
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

    const AMOUNT = 10000
    const createTx: EscrowCreate = {
      Account: this.wallet.getClassicAddress(),
      TransactionType: 'EscrowCreate',
      Amount: String(AMOUNT),
      Destination: wallet1.getClassicAddress(),
      FinishAfter: CLOSE_TIME + 2,
    }

    await testTransaction(this.client, createTx, this.wallet)

    const initialBalance = (
      await this.client.getBalances(wallet1.getClassicAddress())
    )[0].value

    // check that the object was actually created
    assert.equal(
      (
        await this.client.request({
          command: 'account_objects',
          account: this.wallet.getClassicAddress(),
        })
      ).result.account_objects.length === 1,
      true,
    )

    const finishTx: EscrowFinish = {
      TransactionType: 'EscrowFinish',
      Account: this.wallet.getClassicAddress(),
      Owner: this.wallet.getClassicAddress(),
      OfferSequence: getSequence(),
    }
    await testTransaction(this.client, finishTx, this.wallet)

    const expectedBalance = Number(initialBalance) + Number(dropsToXrp(AMOUNT))
    assert.equal(
      (await this.client.getBalances(wallet1.getClassicAddress()))[0].value,
      expectedBalance,
    )
  })
})
