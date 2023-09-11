import { assert } from 'chai'
import { isValidClassicAddress } from 'xrpl'

import { AMMInfoResponse, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, setupAMMPool } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AMMCreate', function () {
  let testContext: XrplIntegrationTestContext
  let wallet: Wallet
  let wallet2: Wallet
  let currencyCode: string
  let ammInfoRes: AMMInfoResponse

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet = testContext.wallet
    wallet2 = await generateFundedWallet(testContext.client)
    currencyCode = 'USD'

    ammInfoRes = await setupAMMPool(
      testContext.client,
      wallet,
      wallet2,
      currencyCode,
    )
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async function () {
      const { amm } = ammInfoRes.result

      assert.isTrue(isValidClassicAddress(amm.account))
      assert.equal(amm.amount, '250')
      assert.deepEqual(amm.amount2, {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
        value: '250',
      })
      assert.equal(amm.trading_fee, 12)
    },
    TIMEOUT,
  )
})
