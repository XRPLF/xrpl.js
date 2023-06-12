import { assert } from 'chai'

import { AccountSet, hashes, SubmitResponse, TxResponse } from '../../../src'
import { convertStringToHex } from '../../../src/utils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000
const { hashSignedTx } = hashes

describe('tx', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const account = testContext.wallet.classicAddress
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: account,
        Domain: convertStringToHex('example.com'),
      }

      const response: SubmitResponse = await testContext.client.submit(
        accountSet,
        {
          wallet: testContext.wallet,
        },
      )

      const hash = hashSignedTx(response.result.tx_blob)
      const txResponse = await testContext.client.request({
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
          SigningPubKey: testContext.wallet.publicKey,
          TxnSignature: txResponse.result.TxnSignature,
          hash: hashSignedTx(response.result.tx_blob),
          validated: false,
        },
      }

      assert.deepEqual(txResponse, expectedResponse)
    },
    TIMEOUT,
  )
})
