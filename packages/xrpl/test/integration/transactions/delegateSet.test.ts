import { AssertionError } from 'assert'

import { assert } from 'chai'

import {
  AccountSet,
  DelegateSet,
  LedgerDataResponse,
  LedgerEntryResponse,
  LedgerIndex,
  Payment,
  Wallet,
  xrpToDrops,
} from '../../../src'
import { Delegate } from '../../../src/models/ledger'
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
    alice = testContext.wallet
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
    // eslint-disable-next-line max-statements -- needed for ledger data/entry checks
    async () => {
      // Authorize Bob account to execute Payment transactions and
      // modify the domain of an account behalf of Alice's account.
      const delegateTx: DelegateSet = {
        TransactionType: 'DelegateSet',
        Account: alice.address,
        Authorize: bob.address,
        Permissions: [
          { Permission: { PermissionValue: 'Payment' } },
          { Permission: { PermissionValue: 'AccountDomainSet' } },
        ],
      }
      await testTransaction(testContext.client, delegateTx, alice)

      // Verify Delegate ledger entry
      const ledgerEntryRes: LedgerEntryResponse =
        await testContext.client.request({
          command: 'ledger_entry',
          delegate: {
            account: alice.address,
            authorize: bob.address,
          },
        })
      const delegateLedgerEntry = ledgerEntryRes.result.node as Delegate
      assert.equal(delegateLedgerEntry.LedgerEntryType, 'Delegate')
      assert.equal(delegateLedgerEntry.Account, alice.address)
      assert.equal(delegateLedgerEntry.Authorize, bob.address)
      assert.equal(delegateLedgerEntry.Permissions.length, 2)

      // Verify Delegate ledger data
      const grantedPermissions = new Set<string>()
      let marker: unknown
      let ledgerIndex: LedgerIndex = 'validated'
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition -- required
      while (true) {
        const ledgerDataRes: LedgerDataResponse =
          // eslint-disable-next-line no-await-in-loop -- required
          await testContext.client.request({
            command: 'ledger_data',
            type: 'delegate',
            ledger_index: ledgerIndex,
            marker,
          })
        for (const entry of ledgerDataRes.result.state) {
          const delegateEntry = entry as Delegate
          // eslint-disable-next-line max-depth -- required
          if (
            delegateEntry.Account === alice.address &&
            delegateEntry.Authorize === bob.address
          ) {
            grantedPermissions.add(
              delegateEntry.Permissions[0].Permission.PermissionValue,
            )
            grantedPermissions.add(
              delegateEntry.Permissions[1].Permission.PermissionValue,
            )
          }
        }

        if (!ledgerDataRes.result.marker) {
          break
        }
        marker = ledgerDataRes.result.marker
        ledgerIndex = ledgerDataRes.result.ledger_index
      }
      assert.equal(grantedPermissions.size, 2)
      assert.isTrue(grantedPermissions.has('Payment'))
      assert.isTrue(grantedPermissions.has('AccountDomainSet'))

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
