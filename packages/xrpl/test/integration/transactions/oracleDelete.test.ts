import { stringToHex } from '@xrplf/isomorphic/dist/utils'

import { OracleSet, OracleDelete, RippledError } from '../../../src'
import { assertRejects } from '../../testUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OracleDelete', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const setTx: OracleSet = {
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

      await testTransaction(testContext.client, setTx, testContext.wallet)

      const deleteTx: OracleDelete = {
        TransactionType: 'OracleDelete',
        Account: testContext.wallet.classicAddress,
        OracleDocumentID: 1234,
      }

      await testTransaction(testContext.client, deleteTx, testContext.wallet)

      // confirm that the Oracle was actually delete
      await assertRejects(
        testContext.client.request({
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
        }),
        RippledError,
        'The requested object was not found.',
      )
    },
    TIMEOUT,
  )
})
