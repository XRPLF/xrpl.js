/* eslint-disable mocha/no-hooks-for-single-case -- Use of hooks is restricted when there is a single test case. */
import _ from 'lodash'

import { EscrowCancel, EscrowCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import {
  generateFundedWallet,
  getSequence,
  ledgerAccept,
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
      CancelAfter: CLOSE_TIME + 2,
      FinishAfter: CLOSE_TIME + 1,
    }
    await testTransaction(this.client, createTx, this.wallet)
    await ledgerAccept(this.client)
    const cancelTx: EscrowCancel = {
      TransactionType: 'EscrowCancel',
      Account: this.wallet.getClassicAddress(),
      Owner: this.wallet.getClassicAddress(),
      OfferSequence: getSequence(),
    }
    await testTransaction(this.client, cancelTx, this.wallet)
  })
})
