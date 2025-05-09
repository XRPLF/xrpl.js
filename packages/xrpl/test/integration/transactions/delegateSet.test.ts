import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { OracleSet, Payment, Wallet, xrpToDrops } from '../../../src'
import { Oracle } from '../../../src/models/ledger'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DelegateSet', function () {
  let testContext: XrplIntegrationTestContext
  let alice: Wallet
  let bob: Wallet
  let carol: Wallet

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)

    // Note: Using WALLET, DESTINATION accounts could pollute the test results
    alice = await generateFundedWallet(testContext.client)
    bob = await generateFundedWallet(testContext.client)
    carol = await generateFundedWallet(testContext.client)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'no permission',
    async () => {
      const tx: Payment = {
        TransactionType: 'Payment',
        Account: alice.address,
        Amount: xrpToDrops(1),
        Destination: carol.address,
        Delegate: bob.address,
      }
      const response = await testTransaction(testContext.client, tx, bob)
      assert.equal(response.result.engine_result, 'tecNO_PERMISSION')
    },
    TIMEOUT,
  )
})
