import { assert } from 'chai'

import { Wallet } from '../../../src'
import {
  deriveConfidentialKeypair,
  prepareConfidentialClawback,
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

describe('ConfidentialMPTClawback', function () {
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
    'lets the issuer claw back a holder confidential balance',
    async () => {
      const holder = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )

      await testTransaction(
        testContext.client,
        await prepareConfidentialClawback(testContext.client, {
          account: issuer.classicAddress,
          holder: holder.wallet.classicAddress,
          issuerKeypair: issuerKey,
          mptIssuanceID: mptID,
        }),
        issuer,
      )

      assert.strictEqual(
        await getSpendable(testContext.client, holder, mptID),
        0n,
        'the holder confidential balance is zeroed',
      )
    },
    TIMEOUT,
  )

  it(
    'rejects a clawback whose amount does not match the balance (tecBAD_PROOF)',
    async () => {
      const holder = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )

      // The clawback proof asserts the issuer-encrypted balance equals the
      // stated amount, so an amount other than the full balance yields an
      // unverifiable proof — rippled enforces this server-side.
      await testTransaction(
        testContext.client,
        await prepareConfidentialClawback(testContext.client, {
          account: issuer.classicAddress,
          holder: holder.wallet.classicAddress,
          issuerKeypair: issuerKey,
          amount: 400n,
          mptIssuanceID: mptID,
        }),
        issuer,
        undefined,
        'tecBAD_PROOF',
      )
    },
    TIMEOUT,
  )
})
