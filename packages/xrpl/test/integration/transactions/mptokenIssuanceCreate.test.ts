import { assert } from 'chai'

import { MPTokenIssuanceCreate } from '../../../src'
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
      const tx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        // 0x7fffffffffffffff
        MaximumAmount: '9223372036854775807',
        AssetScale: 2,
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
    },
    TIMEOUT,
  )
})
