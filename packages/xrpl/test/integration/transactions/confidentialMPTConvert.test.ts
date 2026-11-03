import { decryptAmount } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  deriveConfidentialKeypair,
  fetchMPToken,
  prepareConfidentialConvert,
  prepareConfidentialMergeInbox,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import { Payment } from '../../../src/models/transactions'
import {
  createConfidentialIssuance,
  getSpendable,
  holderWithBalance,
  setupConfidentialClient,
  setupHolder,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

/*
 * Requires a rippled with the MPTokensV1 + Clawback + ConfidentialTransfer
 * amendments enabled — the `develop` CI image once PR #5860 lands (a local
 * standalone in the meantime).
 */
const SETUP_TIMEOUT = 60000
const TIMEOUT = 60000

describe('ConfidentialMPTConvert', function () {
  let testContext: ConfidentialContext
  let issuer: Wallet
  let issuerKey: ConfidentialKeypair
  let mptID: string

  beforeAll(async () => {
    testContext = await setupConfidentialClient(serverUrl)
    issuer = await generateFundedWallet(testContext.client)
    issuerKey = deriveConfidentialKeypair()
    mptID = await createConfidentialIssuance(
      testContext.client,
      issuer,
      issuerKey,
    )
  }, SETUP_TIMEOUT)

  afterAll(async () => teardownConfidential(testContext))

  it(
    'moves a public balance into the confidential inbox and registers the holder key',
    async () => {
      const holder = await setupHolder(testContext.client, mptID)
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: issuer.classicAddress,
        Destination: holder.wallet.classicAddress,
        Amount: { mpt_issuance_id: mptID, value: '1000' },
      }
      await testTransaction(testContext.client, payment, issuer)

      const convert = await prepareConfidentialConvert(testContext.client, {
        account: holder.wallet.classicAddress,
        amount: 1000n,
        holderKeypair: holder.key,
        mptIssuanceID: mptID,
      })
      await testTransaction(testContext.client, convert, holder.wallet)

      const token = await fetchMPToken(
        testContext.client,
        holder.wallet.classicAddress,
        mptID,
      )
      assert.strictEqual(
        token.HolderEncryptionKey,
        holder.key.publicKey,
        'the holder encryption key is registered',
      )
      assert.isString(token.ConfidentialBalanceInbox)
      assert.strictEqual(
        await decryptAmount(
          token.ConfidentialBalanceInbox as string,
          holder.key.privateKey,
          1_000_000n,
        ),
        1000n,
        'the inbox holds the converted amount',
      )
      // The amount is not yet spendable (it must be merged first).
      assert.strictEqual(
        await getSpendable(testContext.client, holder, mptID),
        0n,
        'the spendable balance is still empty before merge',
      )
    },
    TIMEOUT,
  )

  it(
    'tops up an already-registered holder without re-registering the key',
    async () => {
      // First convert + merge registers the key and gives a spendable balance.
      const holder = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )

      // Pay another public 500 and convert it — a *second* Convert on the same
      // holder, whose key is already on the ledger.
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: issuer.classicAddress,
        Destination: holder.wallet.classicAddress,
        Amount: { mpt_issuance_id: mptID, value: '500' },
      }
      await testTransaction(testContext.client, payment, issuer)

      const topUp = await prepareConfidentialConvert(testContext.client, {
        account: holder.wallet.classicAddress,
        amount: 500n,
        holderKeypair: holder.key,
        mptIssuanceID: mptID,
        // No registerKey passed: the builder must auto-detect that the key is
        // already registered and omit it — otherwise rippled rejects the
        // duplicate registration with tecDUPLICATE.
      })
      assert.isUndefined(
        topUp.HolderEncryptionKey,
        'a top-up Convert must not re-register the holder key',
      )
      assert.isUndefined(topUp.ZKProof)
      // Submitting confirms rippled accepts it (tecDUPLICATE if the key were re-sent).
      await testTransaction(testContext.client, topUp, holder.wallet)

      // Merge the new inbox amount; the two converts accumulate to 1500.
      await testTransaction(
        testContext.client,
        await prepareConfidentialMergeInbox(testContext.client, {
          account: holder.wallet.classicAddress,
          mptIssuanceID: mptID,
        }),
        holder.wallet,
      )
      assert.strictEqual(
        await getSpendable(testContext.client, holder, mptID),
        1500n,
        'both converts accumulate in the spendable balance',
      )
    },
    TIMEOUT,
  )

  it(
    'registers with a zero-amount Convert, then funds with a later Convert',
    async () => {
      const holder = await setupHolder(testContext.client, mptID)

      // Step 1: a zero-amount Convert registers the holder key without moving funds.
      const register = await prepareConfidentialConvert(testContext.client, {
        account: holder.wallet.classicAddress,
        amount: 0n,
        holderKeypair: holder.key,
        mptIssuanceID: mptID,
      })
      assert.strictEqual(
        register.HolderEncryptionKey,
        holder.key.publicKey,
        'the first (zero-amount) Convert registers the key',
      )
      await testTransaction(testContext.client, register, holder.wallet)

      // Step 2: pay public MPT, then a funded Convert. The key already exists, so
      // the builder must omit it on this second Convert.
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: issuer.classicAddress,
        Destination: holder.wallet.classicAddress,
        Amount: { mpt_issuance_id: mptID, value: '750' },
      }
      await testTransaction(testContext.client, payment, issuer)

      const fund = await prepareConfidentialConvert(testContext.client, {
        account: holder.wallet.classicAddress,
        amount: 750n,
        holderKeypair: holder.key,
        mptIssuanceID: mptID,
      })
      assert.isUndefined(
        fund.HolderEncryptionKey,
        'the funding Convert must not re-register the key',
      )
      await testTransaction(testContext.client, fund, holder.wallet)

      await testTransaction(
        testContext.client,
        await prepareConfidentialMergeInbox(testContext.client, {
          account: holder.wallet.classicAddress,
          mptIssuanceID: mptID,
        }),
        holder.wallet,
      )
      assert.strictEqual(
        await getSpendable(testContext.client, holder, mptID),
        750n,
        'the funded amount lands in the spendable balance',
      )
    },
    TIMEOUT,
  )
})
