import { assert } from 'chai'

import { TrustSet, percentToQuality, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

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
    'Create a Deep-Frozen trust line',
    async () => {
      assert(wallet2 != null)
      // preemptively deep-freeze a trust line with the specified counter-party/currency-code
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

      // assert that the trust line is deep-frozen
      const trustLine = await testContext.client.request({
        command: 'account_lines',
        account: testContext.wallet.classicAddress,
      })

      // assert that the TrustLine is deep-frozen
      assert.equal(trustLine.result.lines[0].freeze, true)

      // Keshava: ensure that account_lines RPC response contains a deep_freeze flag
      // assert.equal(trustLine.result.lines[0].deep_freeze, true)
    },
    TIMEOUT,
  )
})
