/* eslint-disable no-console -- to debug */
import { assert } from 'chai'

import { Payment, Wallet, xrpToDrops } from '../../../src'
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
      try {
        await testTransaction(testContext.client, tx, bob)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AssertionError type
      } catch (err: any) {
        console.log('yo toString')
        console.log(err.toString())
        console.log('yo message')
        console.log(err.message)
        assert.equal(
          err.message,
          "No permission to perform requested operation.: expected 'tecNO_PERMISSION' to equal 'tesSUCCESS'",
        )
      }
    },
    TIMEOUT,
  )
})
