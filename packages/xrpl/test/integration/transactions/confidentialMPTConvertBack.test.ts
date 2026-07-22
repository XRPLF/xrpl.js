import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  deriveConfidentialKeypair,
  prepareConfidentialConvertBack,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import {
  createConfidentialIssuance,
  getSpendable,
  holderWithBalance,
  setupConfidentialClient,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

const SETUP_TIMEOUT = 60000
const TIMEOUT = 120000

describe('ConfidentialMPTConvertBack', function () {
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
    'reveals a public amount from the confidential balance',
    async () => {
      const holder = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )

      await testTransaction(
        testContext.client,
        await prepareConfidentialConvertBack(testContext.client, {
          account: holder.wallet.classicAddress,
          amount: 400n,
          holder: holder.key,
          mptIssuanceID: mptID,
        }),
        holder.wallet,
      )

      assert.strictEqual(
        await getSpendable(testContext.client, holder, mptID),
        600n,
        'spendable is reduced by the revealed amount',
      )
    },
    TIMEOUT,
  )
})
