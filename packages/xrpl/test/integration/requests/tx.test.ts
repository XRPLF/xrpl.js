import { assert } from 'chai'

import {
  AccountSet,
  hashes,
  SubmitResponse,
  TxRequest,
  TxResponse,
  TxV1Response,
} from '../../../src'
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
        api_version: 2,
        id: txResponse.id,
        type: 'response',
        result: {
          hash: hashSignedTx(response.result.tx_blob),
          tx_json: {
            ...accountSet,
            Fee: txResponse.result.tx_json.Fee,
            Flags: 0,
            LastLedgerSequence: txResponse.result.tx_json.LastLedgerSequence,
            Sequence: txResponse.result.tx_json.Sequence,
            SigningPubKey: testContext.wallet.publicKey,
            TxnSignature: txResponse.result.tx_json.TxnSignature,
          },
          validated: false,
        },
      }

      assert.deepEqual(txResponse, expectedResponse)
    },
    TIMEOUT,
  )

  it(
    'uses api_version 1',
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
      const txV1Response = await testContext.client.request<TxRequest, 1>({
        command: 'tx',
        transaction: hash,
        api_version: 1,
      })

      const expectedResponse: TxV1Response = {
        api_version: 1,
        id: txV1Response.id,
        type: 'response',
        result: {
          ...accountSet,
          Fee: txV1Response.result.Fee,
          Flags: 0,
          LastLedgerSequence: txV1Response.result.LastLedgerSequence,
          Sequence: txV1Response.result.Sequence,
          SigningPubKey: testContext.wallet.publicKey,
          TxnSignature: txV1Response.result.TxnSignature,
          hash: hashSignedTx(response.result.tx_blob),
          validated: false,
        },
      }

      assert.deepEqual(txV1Response, expectedResponse)
    },
    TIMEOUT,
  )
})
