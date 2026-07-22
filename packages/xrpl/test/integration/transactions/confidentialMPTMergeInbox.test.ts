import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  deriveConfidentialKeypair,
  prepareConfidentialConvert,
  prepareConfidentialMergeInbox,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import { Payment } from '../../../src/models/transactions'
import {
  createConfidentialIssuance,
  getSpendable,
  setupConfidentialClient,
  setupHolder,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

const SETUP_TIMEOUT = 60000
const TIMEOUT = 60000

describe('ConfidentialMPTMergeInbox', function () {
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
    'folds the confidential inbox into the spendable balance',
    async () => {
      const holder = await setupHolder(testContext.client, mptID)
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: issuer.classicAddress,
        Destination: holder.wallet.classicAddress,
        Amount: { mpt_issuance_id: mptID, value: '500' },
      }
      await testTransaction(testContext.client, payment, issuer)
      await testTransaction(
        testContext.client,
        await prepareConfidentialConvert(testContext.client, {
          account: holder.wallet.classicAddress,
          amount: 500n,
          holder: holder.key,
          mptIssuanceID: mptID,
        }),
        holder.wallet,
      )

      // After convert the amount is in the inbox, not yet spendable.
      assert.strictEqual(
        await getSpendable(testContext.client, holder, mptID),
        0n,
        'spendable is empty before merge',
      )

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
        500n,
        'spendable equals the merged amount',
      )
    },
    TIMEOUT,
  )
})
