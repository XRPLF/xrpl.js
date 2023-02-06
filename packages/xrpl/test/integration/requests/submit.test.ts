import { assert } from 'chai'
import { decode } from 'ripple-binary-codec'

import {
  AccountSet,
  SubmitRequest,
  SubmitResponse,
  hashes,
  Transaction,
} from '../../../src'
import { convertStringToHex } from '../../../src/utils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { ledgerAccept, verifySubmittedTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000
const { hashSignedTx } = hashes

describe('submit', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'submit',
    async () => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }

      const autofilledTx = await testContext.client.autofill(accountSet)
      const signedTx = testContext.wallet.sign(autofilledTx)
      const submitRequest: SubmitRequest = {
        command: 'submit',
        tx_blob: signedTx.tx_blob,
      }
      const submitResponse = await testContext.client.request(submitRequest)

      await ledgerAccept(testContext.client)
      await verifySubmittedTransaction(
        testContext.client,
        signedTx.tx_blob,
        signedTx.hash,
      )

      const expectedResponse: SubmitResponse = {
        id: submitResponse.id,
        type: 'response',
        result: {
          engine_result: 'tesSUCCESS',
          engine_result_code: 0,
          engine_result_message:
            'The transaction was applied. Only final in a validated ledger.',
          tx_blob: signedTx.tx_blob,
          tx_json: {
            ...(decode(signedTx.tx_blob) as unknown as Transaction),
            hash: hashSignedTx(signedTx.tx_blob),
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
    },
    TIMEOUT,
  )
})
