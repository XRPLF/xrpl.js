import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { OracleSet, getCurrentUnixTimestamp } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OracleSet', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: OracleSet = {
        TransactionType: 'OracleSet',
        Account: testContext.wallet.classicAddress,
        OracleDocumentID: 1234,
        LastUpdateTime: getCurrentUnixTimestamp(),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: 'XRP',
              QuoteAsset: 'USD',
              AssetPrice: 740,
              Scale: 3,
            },
          },
        ],
        Provider: stringToHex('chainlink'),
        URI: '6469645F6578616D706C65',
        AssetClass: stringToHex('currency'),
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
      })

      // confirm that the Oracle was actually created
      assert.equal(result.result.account_objects.length, 1)
    },
    TIMEOUT,
  )
})
