import { assert } from 'chai'

import {
  MPTokenIssuanceCreate,
  MPTokenIssuanceSet,
  MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSetFlags,
  TransactionMetadata,
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

describe('MPTokenIssuanceDestroy', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanLock,
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

      const setTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: mptID!,
        Flags: MPTokenIssuanceSetFlags.tfMPTLock,
      }

      await testTransaction(testContext.client, setTx, testContext.wallet)
    },
    TIMEOUT,
  )
})
