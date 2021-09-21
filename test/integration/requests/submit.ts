import { assert } from 'chai'
import _ from 'lodash'

import { AccountSet } from 'xrpl-local'
import { convertStringToHex } from 'xrpl-local/utils'

import { SubmitRequest, SubmitResponse } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { ledgerAccept, verifySubmittedTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('submit', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('submit', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }

    const autofilledTx = await this.client.autofill(accountSet)
    const signedTx = this.wallet.signTransaction(autofilledTx)
    const submitRequest: SubmitRequest = {
      command: 'submit',
      tx_blob: signedTx,
    }
    const response: SubmitResponse = await this.client.request(submitRequest)
    assert.equal(response.status, 'success')

    await ledgerAccept(this.client)
    await verifySubmittedTransaction(this.client, signedTx)
  })
})
