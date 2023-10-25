import { assert } from 'chai'

import { XChainCreateBridge, XChainModifyBridge } from '../../../src'
import { Bridge } from '../../../src/models/ledger'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { GENESIS_ACCOUNT, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('XChainCreateBridge', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const setupTx: XChainCreateBridge = {
        TransactionType: 'XChainCreateBridge',
        Account: testContext.wallet.classicAddress,
        XChainBridge: {
          LockingChainDoor: testContext.wallet.classicAddress,
          LockingChainIssue: { currency: 'XRP' },
          IssuingChainDoor: GENESIS_ACCOUNT,
          IssuingChainIssue: { currency: 'XRP' },
        },
        SignatureReward: '200',
        MinAccountCreateAmount: '10000000',
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      // confirm that the transaction actually went through
      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'bridge',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one bridge owned by the account',
      )
      const initialBridge = accountObjectsResponse.result
        .account_objects[0] as unknown as Bridge
      assert.equal(
        initialBridge.SignatureReward,
        '200',
        'Signature reward is incorrect',
      )

      const tx: XChainModifyBridge = {
        TransactionType: 'XChainModifyBridge',
        Account: testContext.wallet.classicAddress,
        XChainBridge: {
          LockingChainDoor: testContext.wallet.classicAddress,
          LockingChainIssue: { currency: 'XRP' },
          IssuingChainDoor: GENESIS_ACCOUNT,
          IssuingChainIssue: { currency: 'XRP' },
        },
        SignatureReward: '300',
      }
      await testTransaction(testContext.client, tx, testContext.wallet)

      // confirm that the transaction actually went through
      const accountObjectsResponse2 = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'bridge',
      })
      assert.lengthOf(
        accountObjectsResponse2.result.account_objects,
        1,
        'Should be exactly one bridge owned by the account',
      )
      const finalBridge = accountObjectsResponse2.result
        .account_objects[0] as unknown as Bridge
      assert.equal(
        finalBridge.SignatureReward,
        '300',
        'Signature reward was not modified',
      )
    },
    TIMEOUT,
  )
})
