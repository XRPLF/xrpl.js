/* eslint-disable n/no-process-env -- gated on a confidential-capable rippled */
import { decryptAmount, generateKeypair } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  fetchMPToken,
  prepareConfidentialSend,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

import {
  createConfidentialIssuance,
  getSpendable,
  holderWithBalance,
  registerHolderKey,
  setupConfidentialClient,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'

const RUN = process.env.CONFIDENTIAL_MPT === 'true'
const SETUP_TIMEOUT = 60000
const TIMEOUT = 120000

;(RUN ? describe : describe.skip)('ConfidentialMPTSend', function () {
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
    'transfers a confidential amount into the destination inbox',
    async () => {
      const sender = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )
      const dest = await registerHolderKey(testContext.client, mptID)

      await testTransaction(
        testContext.client,
        await prepareConfidentialSend(testContext.client, {
          account: sender.wallet.classicAddress,
          destination: dest.wallet.classicAddress,
          amount: 300n,
          sender: sender.key,
          mptIssuanceID: mptID,
        }),
        sender.wallet,
      )

      assert.strictEqual(
        await getSpendable(testContext.client, sender, mptID),
        700n,
        'sender balance is reduced by the sent amount',
      )

      const destToken = await fetchMPToken(
        testContext.client,
        dest.wallet.classicAddress,
        mptID,
      )
      assert.isString(destToken.ConfidentialBalanceInbox)
      assert.strictEqual(
        await decryptAmount(
          destToken.ConfidentialBalanceInbox as string,
          dest.key.privateKey,
        ),
        300n,
        'destination inbox received the sent amount',
      )
    },
    TIMEOUT,
  )
})
