import { assert } from 'chai'

import { MPTokenIssuanceCreate } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'
import { mptUint64ToHex } from '../../../src/utils'

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
        MaximumAmount: mptUint64ToHex('9223372036854775807'), // 0x7fffffffffffffff
        AssetScale: 2,
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      let accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects!,
        1,
        'Should be exactly one issuance on the ledger',
      )
    },
    TIMEOUT,
  )
})
