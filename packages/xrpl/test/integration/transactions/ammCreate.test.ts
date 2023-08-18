import { assert } from 'chai'
import {
  AccountSet,
  AccountSetAsfFlags,
  AMMCreate,
  isValidClassicAddress,
  Payment,
  TrustSet,
  TrustSetFlags,
} from 'xrpl'

import { AMMInfoResponse, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AMMCreate', function () {
  let testContext: XrplIntegrationTestContext
  let wallet: Wallet
  let wallet2: Wallet
  let currencyCode: string

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet = testContext.wallet
    wallet2 = await generateFundedWallet(testContext.client)
    currencyCode = 'USD'

    const accountSetTx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: wallet2.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
    }

    await testTransaction(testContext.client, accountSetTx, wallet2)

    const trustSetTx: TrustSet = {
      TransactionType: 'TrustSet',
      Flags: TrustSetFlags.tfClearNoRipple,
      Account: wallet.classicAddress,
      LimitAmount: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
        value: '1000',
      },
    }

    await testTransaction(testContext.client, trustSetTx, wallet)

    const paymentTx: Payment = {
      TransactionType: 'Payment',
      Account: wallet2.classicAddress,
      Destination: wallet.classicAddress,
      Amount: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
        value: '500',
      },
    }

    await testTransaction(testContext.client, paymentTx, wallet2)
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async function () {
      const ammCreateTx: AMMCreate = {
        TransactionType: 'AMMCreate',
        Account: wallet.classicAddress,
        Amount: '250',
        Amount2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
          value: '250',
        },
        TradingFee: 12,
      }

      await testTransaction(testContext.client, ammCreateTx, wallet)

      const ammInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

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
