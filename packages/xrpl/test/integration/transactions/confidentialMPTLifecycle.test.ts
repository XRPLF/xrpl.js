import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  prepareConfidentialClawback,
  prepareConfidentialConvertBack,
  prepareConfidentialMergeInbox,
  prepareConfidentialSend,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

import {
  auditorReads,
  createConfidentialIssuance,
  generateElGamalKeypair,
  getSpendable,
  holderWithBalance,
  registerHolderKey,
  setupConfidentialClient,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'

/*
 * The four-party scenario (issuer, auditor, and two holders). It exercises every
 * confidential transaction type in sequence and verifies auditor selective
 * disclosure (the auditor decrypts each holder's balance) after each change.
 * Requires the MPTokensV1 + Clawback + ConfidentialTransfer amendments (see
 * ./confidentialMPTUtils.ts).
 */
const SETUP_TIMEOUT = 60000
const LIFECYCLE_TIMEOUT = 240000

describe(
  'Confidential MPT 4-party lifecycle',
  function () {
    let testContext: ConfidentialContext
    let issuer: Wallet
    let issuerKey: ConfidentialKeypair
    let auditorKey: ConfidentialKeypair
    let mptID: string

    beforeAll(async () => {
      testContext = await setupConfidentialClient(serverUrl)
      issuer = await generateFundedWallet(testContext.client)
      issuerKey = generateElGamalKeypair()
      auditorKey = generateElGamalKeypair()
      mptID = await createConfidentialIssuance(
        testContext.client,
        issuer,
        issuerKey,
        auditorKey,
      )
    }, SETUP_TIMEOUT)

    afterAll(async () => teardownConfidential(testContext))

    it(
      'runs convert, merge, send, convert-back, and clawback with auditor disclosure',
      async () => {
        const client = testContext.client

        // Holder1 converts 1000 public -> confidential and merges.
        const holder1 = await holderWithBalance(client, issuer, mptID, 1000n)
        assert.strictEqual(await getSpendable(client, holder1, mptID), 1000n)
        assert.strictEqual(
          await auditorReads(client, holder1.wallet.classicAddress, mptID, auditorKey),
          1000n,
          'auditor sees holder1 = 1000 after convert',
        )

        // Holder2 registers its key; holder1 sends 300; holder2 merges.
        const holder2 = await registerHolderKey(client, mptID)
        await testTransaction(
          client,
          await prepareConfidentialSend(client, {
            account: holder1.wallet.classicAddress,
            destination: holder2.wallet.classicAddress,
            amount: 300n,
            sender: holder1.key,
            mptIssuanceID: mptID,
          }),
          holder1.wallet,
        )
        await testTransaction(
          client,
          await prepareConfidentialMergeInbox(client, {
            account: holder2.wallet.classicAddress,
            mptIssuanceID: mptID,
          }),
          holder2.wallet,
        )
        assert.strictEqual(await getSpendable(client, holder1, mptID), 700n)
        assert.strictEqual(await getSpendable(client, holder2, mptID), 300n)
        assert.strictEqual(
          await auditorReads(client, holder1.wallet.classicAddress, mptID, auditorKey),
          700n,
          'auditor sees holder1 = 700 after send',
        )
        assert.strictEqual(
          await auditorReads(client, holder2.wallet.classicAddress, mptID, auditorKey),
          300n,
          'auditor sees holder2 = 300 after receive',
        )

        // Holder1 reveals 200 back to public.
        await testTransaction(
          client,
          await prepareConfidentialConvertBack(client, {
            account: holder1.wallet.classicAddress,
            amount: 200n,
            holder: holder1.key,
            mptIssuanceID: mptID,
          }),
          holder1.wallet,
        )
        assert.strictEqual(await getSpendable(client, holder1, mptID), 500n)

        // Issuer claws back holder1's remaining balance.
        await testTransaction(
          client,
          await prepareConfidentialClawback(client, {
            account: issuer.classicAddress,
            holder: holder1.wallet.classicAddress,
            issuer: issuerKey,
            mptIssuanceID: mptID,
          }),
          issuer,
        )
        assert.strictEqual(await getSpendable(client, holder1, mptID), 0n)
      },
      LIFECYCLE_TIMEOUT,
    )
  },
)
