import { assert } from 'chai'

import { DIDSet, DIDDelete } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DIDDelete', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const setupTx: DIDSet = {
        TransactionType: 'DIDSet',
        Account: testContext.wallet.address,
        Data: '617474657374',
        DIDDocument: '646F63',
        URI: '6469645F6578616D706C65',
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      // double check the DID was properly created
      const initialAccountOffersResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.address,
        type: 'did',
      })
      assert.lengthOf(
        initialAccountOffersResponse.result.account_objects,
        1,
        'Should be exactly one DID on the ledger after a DIDSet transaction',
      )

      // actual test - cancel the check
      const tx: DIDDelete = {
        TransactionType: 'DIDDelete',
        Account: testContext.wallet.address,
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // confirm that the DID no longer exists
      const accountOffersResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.address,
        type: 'did',
      })
      assert.lengthOf(
        accountOffersResponse.result.account_objects,
        0,
        'Should be no DID on the ledger after a DIDDelete transaction',
      )
    },
    TIMEOUT,
  )
})
