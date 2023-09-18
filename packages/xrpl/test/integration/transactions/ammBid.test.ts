import { assert } from 'chai'
import { AMMBid, AMMDeposit, AMMDepositFlags, IssuedCurrencyAmount } from 'xrpl'

import { AMMInfoResponse, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, setupAMMPool, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AMMBid', function () {
  let testContext: XrplIntegrationTestContext
  let wallet: Wallet
  let wallet2: Wallet
  let wallet3: Wallet
  let currencyCode: string
  let lptoken: IssuedCurrencyAmount

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet = testContext.wallet
    wallet2 = await generateFundedWallet(testContext.client)
    wallet3 = await generateFundedWallet(testContext.client)
    currencyCode = 'USD'

    const ammInfoRes = await setupAMMPool(
      testContext.client,
      wallet,
      wallet2,
      currencyCode,
    )

    const { amm } = ammInfoRes.result
    lptoken = amm.lp_token
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'bid',
    async function () {
      const ammDepositTx: AMMDeposit = {
        TransactionType: 'AMMDeposit',
        Account: wallet3.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        Amount: '1000',
        Flags: AMMDepositFlags.tfSingleAsset,
      }

      await testTransaction(testContext.client, ammDepositTx, wallet3)

      const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

      const { amm: preAmm } = preAmmInfoRes.result
      const { auction_slot: preAuctionSlot, lp_token: preLPToken } = preAmm
      if (preAuctionSlot === undefined) {
        throw new Error('preAuctionSlot should not be undefined')
      }

      const ammBidTx: AMMBid = {
        TransactionType: 'AMMBid',
        Account: wallet3.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      }

      await testTransaction(testContext.client, ammBidTx, wallet3)

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
      const { auction_slot, lp_token } = amm

      if (auction_slot === undefined) {
        throw new Error('auction_slot should not be undefined')
      }
      assert.equal(auction_slot.price.value > preAuctionSlot.price.value, true)
      assert.equal(lp_token.value < preLPToken.value, true)
    },
    TIMEOUT,
  )

  it(
    'vote with AuthAccounts, BidMin, BidMax',
    async function () {
      const ammDepositTx: AMMDeposit = {
        TransactionType: 'AMMDeposit',
        Account: wallet3.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        Amount: '1000',
        Flags: AMMDepositFlags.tfSingleAsset,
      }

      await testTransaction(testContext.client, ammDepositTx, wallet3)

      const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

      const { amm: preAmm } = preAmmInfoRes.result
      const { auction_slot: preAuctionSlot, lp_token: preLPToken } = preAmm
      if (preAuctionSlot === undefined) {
        throw new Error('preAuctionSlot should not be undefined')
      }

      const ammBidTx: AMMBid = {
        TransactionType: 'AMMBid',
        Account: wallet3.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        AuthAccounts: [
          {
            AuthAccount: {
              Account: wallet.classicAddress,
            },
          },
        ],
        BidMin: { ...lptoken, value: '5' },
        BidMax: { ...lptoken, value: '10' },
      }

      await testTransaction(testContext.client, ammBidTx, wallet3)

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
      const { auction_slot, lp_token } = amm

      if (auction_slot === undefined) {
        throw new Error('auction_slot should not be undefined')
      }
      assert.equal(auction_slot.price.value > preAuctionSlot.price.value, true)
      assert.equal(lp_token.value < preLPToken.value, true)
      assert.deepEqual(auction_slot.auth_accounts, [
        {
          account: wallet.classicAddress,
        },
      ])
    },
    TIMEOUT,
  )
})
