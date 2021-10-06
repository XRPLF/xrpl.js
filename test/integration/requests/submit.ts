import { assert } from 'chai'
import _ from 'lodash'
import { decode } from 'ripple-binary-codec/dist'

import {
  AccountSet,
  SubmitRequest,
  SubmitResponse,
  computeSignedTransactionHash,
  Transaction,
} from 'xrpl-local'
import { convertStringToHex } from 'xrpl-local/utils'

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
    const submitResponse = await this.client.request(submitRequest)

    await ledgerAccept(this.client)
    await verifySubmittedTransaction(this.client, signedTx)

    const expectedResponse: SubmitResponse = {
      id: submitResponse.id,
      type: 'response',
      result: {
        engine_result: 'tesSUCCESS',
        engine_result_code: 0,
        engine_result_message:
          'The transaction was applied. Only final in a validated ledger.',
        tx_blob: signedTx,
        tx_json: {
          ...(decode(signedTx) as unknown as Transaction),
          hash: computeSignedTransactionHash(signedTx),
        },
        accepted: true,
        account_sequence_available:
          submitResponse.result.account_sequence_available,
        account_sequence_next: submitResponse.result.account_sequence_next,
        applied: true,
        broadcast: submitResponse.result.broadcast,
        kept: true,
        queued: false,
        open_ledger_cost: submitResponse.result.open_ledger_cost,
        validated_ledger_index: submitResponse.result.validated_ledger_index,
      },
    }

    assert.deepEqual(submitResponse, expectedResponse)
  })
})
