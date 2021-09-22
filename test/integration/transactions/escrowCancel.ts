/* eslint-disable mocha/no-hooks-for-single-case -- Use of hooks is restricted when there is a single test case. */
import _ from 'lodash'

import { EscrowCancel, EscrowCreate, Wallet } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import {
  fundAccount,
  getEpochTime,
  getSequence,
  testTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowCancel', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet1 = Wallet.generate()
    await fundAccount(this.client, wallet1)
    const createTx: EscrowCreate = {
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Account: this.wallet.getClassicAddress(),
      Destination: wallet1.getClassicAddress(),
      CancelAfter: getEpochTime() + 2,
    }
    console.log(createTx)
    await testTransaction(this.client, createTx, this.wallet)
    const cancelTx: EscrowCancel = {
      TransactionType: 'EscrowCancel',
      Account: this.wallet.getClassicAddress(),
      Owner: this.wallet.getClassicAddress(),
      OfferSequence: getSequence(),
    }
    console.log(cancelTx)
    await testTransaction(this.client, cancelTx, this.wallet)
  })
})
