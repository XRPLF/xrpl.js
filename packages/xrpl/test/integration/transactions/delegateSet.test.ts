import { AssertionError } from 'assert'

import { assert } from 'chai'

import {
  AccountSet,
  DelegateSet,
  Payment,
  Wallet,
  xrpToDrops,
} from '../../../src'
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
      } catch (err: unknown) {
        const assertErr = err as AssertionError
        assert.equal(
          assertErr.message,
          "No permission to perform requested operation.: expected 'tecNO_PERMISSION' to equal 'tesSUCCESS'",
        )
      }
    },
    TIMEOUT,
  )

  it(
    'base',
    async () => {
      // Authorize Bob account to execute Payment transactions and
      // modify the domain of an account behalf of Alice's account.
      const delegateTx: DelegateSet = {
        TransactionType: 'DelegateSet',
        Account: alice.address,
        Authorize: bob.address,
        Permissions: [
          { Permission: { PermissionValue: 'Payment' } },
          // { Permission: { PermissionValue: 'AccountDomainSet' } },
        ],
      }
      await testTransaction(testContext.client, delegateTx, alice)

      // Use Bob's account to execute a transaction on behalf of Alice
      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: alice.address,
        Amount: xrpToDrops(1),
        Destination: carol.address,
        Delegate: bob.address,
      }
      const response = await testTransaction(testContext.client, paymentTx, bob)

      // Validate that the transaction was signed by Bob
      assert.equal(response.result.tx_json.Account, alice.address)
      assert.equal(response.result.tx_json.Delegate, bob.address)
      assert.equal(response.result.tx_json.SigningPubKey, bob.publicKey)

      // Use Bob's account to execute a transaction on behalf of Alice
      const accountSetTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: alice.address,
        Delegate: bob.address,
        EmailHash: '10000000002000000000300000000012',
      }

      try {
        await testTransaction(testContext.client, accountSetTx, bob)
      } catch (err: unknown) {
        const assertErr = err as AssertionError
        assert.equal(
          assertErr.message,
          "No permission to perform requested operation.: expected 'tecNO_PERMISSION' to equal 'tesSUCCESS'",
        )
      }
    },
    TIMEOUT,
  )
})
