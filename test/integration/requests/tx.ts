import { assert } from 'chai'
import _ from 'lodash'

import { AccountSet, hashes, SubmitResponse, TxResponse } from 'xrpl-local'
import { convertStringToHex } from 'xrpl-local/utils'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000
const { hashSignedTx } = hashes

describe('tx', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const account = this.wallet.getClassicAddress()
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: account,
      Domain: convertStringToHex('example.com'),
    }

    const response: SubmitResponse = await this.client.submit(
      this.wallet,
      accountSet,
    )

    const hash = hashSignedTx(response.result.tx_blob)
    const txResponse = await this.client.request({
      command: 'tx',
      transaction: hash,
    })

    const expectedResponse: TxResponse = {
      id: txResponse.id,
      type: 'response',
      result: {
        ...accountSet,
        Fee: txResponse.result.Fee,
        Flags: 0,
        LastLedgerSequence: txResponse.result.LastLedgerSequence,
        Sequence: txResponse.result.Sequence,
        SigningPubKey: this.wallet.publicKey,
        TxnSignature: txResponse.result.TxnSignature,
        hash: hashSignedTx(response.result.tx_blob),
        validated: false,
      },
    }

    assert.deepEqual(txResponse, expectedResponse)
  })
})
