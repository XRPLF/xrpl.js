import { assert } from 'chai'

import {
  MPTokenIssuanceCreate,
  MPTokenAuthorize,
  MPTokenIssuanceCreateFlags,
  MPTokenAuthorizeFlags,
  TransactionMetadata,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction, generateFundedWallet } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('MPTokenAuthorize', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTRequireAuth,
      }

      const mptCreateRes = await testTransaction(
        testContext.client,
        createTx,
        testContext.wallet,
      )

      const txHash = mptCreateRes.result.tx_json.hash

      const txResponse = await testContext.client.request({
        command: 'tx',
        transaction: txHash,
      })

      const meta = txResponse.result
        .meta as TransactionMetadata<MPTokenIssuanceCreate>

      const mptID = meta.mpt_issuance_id

      let accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one issuance on the ledger',
      )

      let authTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet2.classicAddress,
        MPTokenIssuanceID: mptID!,
      }

      await testTransaction(testContext.client, authTx, wallet2)

      accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'mptoken',
      })

      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Holder owns 1 MPToken on the ledger',
      )

      authTx = {
        TransactionType: 'MPTokenAuthorize',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: mptID!,
        Holder: wallet2.classicAddress,
      }

      await testTransaction(testContext.client, authTx, testContext.wallet)
      authTx = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet2.classicAddress,
        MPTokenIssuanceID: mptID!,
        Flags: MPTokenAuthorizeFlags.tfMPTUnauthorize,
      }

      await testTransaction(testContext.client, authTx, wallet2)

      accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
      })

      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        0,
        'Holder owns nothing on the ledger',
      )
    },
    TIMEOUT,
  )
})
