import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { OracleSet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('get_aggregate_price', function () {
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
        LastUpdateTime: Math.floor(Date.now() / 1000),
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

      // confirm that the Oracle was actually created
      const getAggregatePriceResponse = await testContext.client.request({
        command: 'get_aggregate_price',
        account: testContext.wallet.classicAddress,
        base_asset: 'XRP',
        quote_asset: 'USD',
        trim: 20,
        oracles: [
          {
            account: testContext.wallet.classicAddress,
            oracle_document_id: 1234,
          },
        ],
      })
      assert.deepEqual(getAggregatePriceResponse.result.entire_set, {
        mean: '0.74',
        size: 1,
        standard_deviation: '0',
      })
      assert.deepEqual(getAggregatePriceResponse.result.trimmed_set, {
        mean: '0.74',
        size: 1,
        standard_deviation: '0',
      })
      assert.equal(getAggregatePriceResponse.result.median, '0.74')
      assert.equal(getAggregatePriceResponse.result.time, tx.LastUpdateTime)
    },
    TIMEOUT,
  )
})
