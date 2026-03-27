import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { OracleSet, OracleDelete } from '../../../src'
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
      const closeTime: string = (
        await testContext.client.request({
          command: 'ledger',
          ledger_index: 'validated',
        })
      ).result.ledger.close_time_iso

      const setTx: OracleSet = {
        TransactionType: 'OracleSet',
        Account: testContext.wallet.classicAddress,
        OracleDocumentID: 1234,
        LastUpdateTime: Math.floor(new Date(closeTime).getTime() / 1000) + 20,
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

      const aoResult = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'oracle',
      })

      // confirm that the Oracle was created
      assert.equal(aoResult.result.account_objects.length, 1)

      const deleteTx: OracleDelete = {
        TransactionType: 'OracleDelete',
        Account: testContext.wallet.classicAddress,
        OracleDocumentID: 1234,
      }

      await testTransaction(testContext.client, deleteTx, testContext.wallet)

      const aoResult2 = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
      })

      // confirm that the Oracle was actually deleted
      assert.equal(aoResult2.result.account_objects.length, 0)
    },
    TIMEOUT,
  )
})
