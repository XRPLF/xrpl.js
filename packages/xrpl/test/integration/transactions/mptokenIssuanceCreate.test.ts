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
        MaximumAmount: '9223372036854775807', // 0x7fffffffffffffff
        AssetScale: 2,
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      let accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects!,
        1,
        'Should be exactly one issuance on the ledger',
      )
      assert.equal(
        // @ts-ignore
        accountObjectsResponse.result.account_objects[0].MaximumAmount,
        `9223372036854775807`,
      )
    },
    TIMEOUT,
  )
})
