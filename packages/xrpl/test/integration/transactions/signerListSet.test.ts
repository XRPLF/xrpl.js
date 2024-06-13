import { assert } from 'chai'

import { SignerListSet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('SignerListSet', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  // Add signerlist
  it(
    'add',
    async () => {
      const tx: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerEntries: [
          {
            SignerEntry: {
              Account: 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs',
              SignerWeight: 1,
            },
          },
          {
            SignerEntry: {
              Account: 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud',
              SignerWeight: 1,
            },
          },
        ],
        SignerQuorum: 2,
      }
      await testTransaction(testContext.client, tx, testContext.wallet)

      const accountInfoResponse = await testContext.client.request({
        command: 'account_info',
        account: testContext.wallet.classicAddress,
        signer_lists: true,
      })
      const signerListInfo = accountInfoResponse.result.signer_lists?.[0]
      assert.deepEqual(
        signerListInfo?.SignerEntries,
        tx.SignerEntries,
        'SignerEntries were not set properly',
      )
      assert.equal(
        signerListInfo?.SignerQuorum,
        tx.SignerQuorum,
        'SignerQuorum was not set properly',
      )
    },
    TIMEOUT,
  )

  // Remove signerlist
  it(
    'remove',
    async () => {
      const tx: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerQuorum: 0,
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )
})
