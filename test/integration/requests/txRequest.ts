import { assert } from 'chai'
import _ from 'lodash'

import { convertStringToHex } from 'xrpl-local/utils'

import {
  AccountSet,
  computeSignedTransactionHash,
  SubmitResponse,
  TxResponse,
} from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('TxRequest', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const account = this.wallet.getClassicAddress()
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: account,
      Domain: convertStringToHex('example.com'),
    }

    const response: SubmitResponse = await this.client.submitTransaction(
      this.wallet,
      accountSet,
    )

    const hash = computeSignedTransactionHash(response.result.tx_blob)
    const data: TxResponse = await this.client.request({
      command: 'tx',
      transaction: hash,
    })

    assert(data.result)
    assert.equal(computeSignedTransactionHash(data.result), hash)
  })
})
