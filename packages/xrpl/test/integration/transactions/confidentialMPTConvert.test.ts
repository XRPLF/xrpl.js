/* eslint-disable n/no-process-env -- gated on a confidential-capable rippled */
import { decryptAmount, generateKeypair } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  fetchMPToken,
  prepareConfidentialConvert,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import { Payment } from '../../../src/models/transactions'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

import {
  createConfidentialIssuance,
  getSpendable,
  setupConfidentialClient,
  setupHolder,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'

/*
 * Skipped unless CONFIDENTIAL_MPT=true, since it needs a rippled with the
 * MPTokensV1 + Clawback + ConfidentialTransfer amendments enabled. Run against a
 * local standalone (a confidential-enabled CI docker image will replace it):
 *
 *   CONFIDENTIAL_MPT=true HOST=127.0.0.1 PORT=6006 \
 *     npx jest --config=jest.config.integration.js \
 *     test/integration/confidential/confidentialMPTConvert.test.ts
 */
const RUN = process.env.CONFIDENTIAL_MPT === 'true'
const SETUP_TIMEOUT = 60000
const TIMEOUT = 60000

;(RUN ? describe : describe.skip)('ConfidentialMPTConvert', function () {
  let testContext: ConfidentialContext
  let issuer: Wallet
  let issuerKey: ConfidentialKeypair
  let mptID: string

  beforeAll(async () => {
    testContext = await setupConfidentialClient(serverUrl)
    issuer = await generateFundedWallet(testContext.client)
    issuerKey = await generateKeypair()
    mptID = await createConfidentialIssuance(testContext.client, issuer, issuerKey)
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
        holder: holder.key,
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
})
