// import { assert } from 'chai'

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
        LastUpdateTime: 4294967295, // Date.now() - 946684800,
        PriceDataSeries: [
          {
            BaseAsset: 'XRP',
            QuoteAsset: 'USD',
            AssetPrice: 740,
            Scale: 3,
          },
        ],
        // Provider: '70726F7669646572',
        // URI: '6469645F6578616D706C65',
        // AssetClass: 'currency',
        // PriceDataSeries: [
        //   {
        //     BaseAsset: 'XRP',
        //     QuoteAsset: 'USD',
        //     AssetPrice: 740,
        //     Scale: 3,
        //   },
        // ],
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // // confirm that the Oracle was actually created
      // const getAggregatePriceResponse = await testContext.client.request({
      //   command: 'get_aggregate_price',
      //   account: testContext.wallet.classicAddress,
      //   base_asset: 'XRP',
      //   quote_asset: 'USD',
      //   trim: 20,
      //   oracles: [
      //     {
      //       account: 'rp047ow9WcPmnNpVHMQV5A4BF6vaL9Abm6',
      //       oracle_document_id: 34,
      //     },
      //     {
      //       account: 'rp147ow9WcPmnNpVHMQV5A4BF6vaL9Abm7',
      //       oracle_document_id: 56,
      //     },
      //     {
      //       account: 'rp247ow9WcPmnNpVHMQV5A4BF6vaL9Abm8',
      //       oracle_document_id: 2,
      //     },
      //     {
      //       account: 'rp347ow9WcPmnNpVHMQV5A4BF6vaL9Abm9',
      //       oracle_document_id: 7,
      //     },
      //     {
      //       account: 'rp447ow9WcPmnNpVHMQV5A4BF6vaL9Abm0',
      //       oracle_document_id: 109,
      //     },
      //   ],
      // })
      // assert.lengthOf(
      //   getAggregatePriceResponse.result.entire_set,
      //   1,
      //   'Should be exactly one DID on the ledger after a OracleSet transaction',
      // )
    },
    TIMEOUT,
  )
})
