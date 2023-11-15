import { assert } from 'chai'

import { DIDSet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DIDSet', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: DIDSet = {
        TransactionType: 'DIDSet',
        Account: testContext.wallet.classicAddress,
        Data: '617474657374',
        DIDDocument: '646F63',
        URI: '6469645F6578616D706C65',
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // confirm that the DID was actually created
      const accountOffersResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'did',
      })
      assert.lengthOf(
        accountOffersResponse.result.account_objects,
        1,
        'Should be exactly one DID on the ledger after a DIDSet transaction',
      )
    },
    TIMEOUT,
  )
})
