import { assert } from 'chai'

import {
  AccountSet,
  hashes,
  SubmitResponse,
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
    'uses api_version 2 (default)',
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

      assert.isDefined(txResponse.result.tx_json)
      // meta is undefined since not validated tx
      assert.isUndefined(txResponse.result.meta)
      // @ts-expect-error: tx_blob is only defined for binary responses
      assert.isUndefined(txResponse.result.tx_blob)
      // @ts-expect-error: meta_blob is only defined for binary responses
      assert.isUndefined(txResponse.result.meta_blob)

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

      // test with binary response
      const txBinaryResponse = await testContext.client.request({
        command: 'tx',
        transaction: hash,
        binary: true,
      })
      assert.isDefined(txBinaryResponse.result.tx_blob)
      // meta_blob is undefined since not validated tx
      assert.isUndefined(txBinaryResponse.result.meta_blob)
      // @ts-expect-error: tx is not defined for binary responses V2
      assert.isUndefined(txBinaryResponse.result.tx)
      // @ts-expect-error: tx_json is not defined for binary responses
      assert.isUndefined(txBinaryResponse.result.tx_json)
      // @ts-expect-error: meta is not defined for binary responses
      assert.isUndefined(txBinaryResponse.result.meta)
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
      const txV1Response = await testContext.client.request({
        command: 'tx',
        transaction: hash,
        api_version: 1,
      })

      // meta is undefined since not validated tx
      assert.isUndefined(txV1Response.result.meta)
      // @ts-expect-error: tx_json is not defined for api_version 1 responses
      assert.isUndefined(txV1Response.result.tx_json)
      // @ts-expect-error: meta_blob is only defined for binary responses
      assert.isUndefined(txV1Response.result.meta_blob)

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

      // test with binary response
      const txBinaryResponse = await testContext.client.request({
        command: 'tx',
        transaction: hash,
        api_version: 1,
        binary: true,
      })
      assert.isDefined(txBinaryResponse.result.tx)
      // meta is undefined since not validated tx
      assert.isUndefined(txBinaryResponse.result.meta)
      // @ts-expect-error: tx_json is not defined for binary responses
      assert.isUndefined(txBinaryResponse.result.tx_json)
      // @ts-expect-error: tx_blob is not defined for binary responses V1
      assert.isUndefined(txBinaryResponse.result.tx_blob)
      // @ts-expect-error: meta_blob is not defined for binary responses V1
      assert.isUndefined(txBinaryResponse.result.meta_blob)
    },
    TIMEOUT,
  )
})
