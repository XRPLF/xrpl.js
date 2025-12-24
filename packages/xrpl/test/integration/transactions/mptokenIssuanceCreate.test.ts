import { assert } from 'chai'

import {
  decodeMPTokenMetadata,
  encodeMPTokenMetadata,
  MPTokenIssuanceCreate,
  MPTokenMetadata,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('MPTokenIssuanceCreate', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const metadata: MPTokenMetadata = {
        ticker: 'TBILL',
        name: 'T-Bill Yield Token',
        desc: 'A yield-bearing stablecoin backed by short-term U.S. Treasuries and money market instruments.',
        icon: 'example.org/tbill-icon.png',
        asset_class: 'rwa',
        asset_subclass: 'treasury',
        issuer_name: 'Example Yield Co.',
        uris: [
          {
            uri: 'exampleyield.co/tbill',
            category: 'website',
            title: 'Product Page',
          },
          {
            uri: 'exampleyield.co/docs',
            category: 'docs',
            title: 'Yield Token Docs',
          },
        ],
        additional_info: {
          interest_rate: '5.00%',
          interest_type: 'variable',
          yield_source: 'U.S. Treasury Bills',
          maturity_date: '2045-06-30',
          cusip: '912796RX0',
        },
      }
      const tx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        // 0x7fffffffffffffff
        MaximumAmount: '9223372036854775807',
        AssetScale: 2,
        MPTokenMetadata: encodeMPTokenMetadata(metadata),
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one issuance on the ledger',
      )
      assert.equal(
        // @ts-expect-error: Known issue with unknown object type
        accountObjectsResponse.result.account_objects[0].MaximumAmount,
        `9223372036854775807`,
      )

      assert.deepStrictEqual(
        decodeMPTokenMetadata(
          // @ts-expect-error: Known issue with unknown object type
          accountObjectsResponse.result.account_objects[0].MPTokenMetadata,
        ),
        metadata,
      )
    },
    TIMEOUT,
  )
})
