import { TrustSet, percentToQuality } from '../../../src'
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

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
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
      const wallet2 = await generateFundedWallet(testContext.client)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.address,
        QualityIn: percentToQuality('99%'),
        QualityOut: percentToQuality('99%'),
        LimitAmount: {
          currency: 'USD',
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
      const wallet2 = await generateFundedWallet(testContext.client)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        QualityIn: percentToQuality('101%'),
        QualityOut: percentToQuality('101%'),
        Account: testContext.wallet.address,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet2.address,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )
})
