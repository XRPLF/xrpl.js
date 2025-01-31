import { assert } from 'chai'

import { TrustSet, percentToQuality, Wallet, TrustSetFlags } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'
import RippleState from '../../../src/models/ledger/RippleState'
// how long before each test case times out
const TIMEOUT = 20000

describe('TrustSet', function () {
  let testContext: XrplIntegrationTestContext
  let wallet2: Wallet | undefined

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    if (!wallet2) {
      // eslint-disable-next-line require-atomic-updates -- race condition doesn't really matter
      wallet2 = await generateFundedWallet(testContext.client)
    }
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      assert(wallet2 != null)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Quality < 1',
    async () => {
      assert(wallet2 != null)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.address,
        QualityIn: percentToQuality('99%'),
        QualityOut: percentToQuality('99%'),
        LimitAmount: {
          currency: 'BTC',
          issuer: wallet2.address,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Quality > 1',
    async () => {
      assert(wallet2 != null)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        QualityIn: percentToQuality('101%'),
        QualityOut: percentToQuality('101%'),
        Account: testContext.wallet.address,
        LimitAmount: {
          currency: 'ETH',
          issuer: wallet2.address,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Create a Deep-Frozen trustline',
    async () => {
      assert(wallet2 != null)
      // deep-freeze a trustline with the specified counter-party/currency-code
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '10',
        },
        Flags: {
          tfSetFreeze: true,
          tfSetDeepFreeze: true,
        },
      }

      const response = await testTransaction(
        testContext.client,
        tx,
        testContext.wallet,
      )
      assert.equal(response.result.engine_result, 'tesSUCCESS')

      // assert that the trustline is frozen
      const trustLine = await testContext.client.request({
        command: 'account_lines',
        account: testContext.wallet.classicAddress,
      })
      assert.equal(trustLine.result.lines[0].freeze, true)

      // verify that the trust-line is deep-frozen
      // this operation cannot be done with the account_lines RPC
      const account_objects = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
      })
      assert.isTrue(((account_objects.result.account_objects[0] as RippleState).Flags & TrustSetFlags.tfSetDeepFreeze) != 0)

    },
    TIMEOUT,
  )
})
