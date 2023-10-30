import { assert } from 'chai'
import { AMMBid } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupAMMPool,
  setupClient,
  teardownClient,
  type TestAMMPool,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('AMMBid', function () {
  let testContext: XrplIntegrationTestContext
  let ammPool: TestAMMPool

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    ammPool = await setupAMMPool(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  it('bid', async function () {
    const { asset, asset2, testWallet } = ammPool

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { auction_slot: preAuctionSlot, lp_token: preLPToken } = preAmm

    assert.ok(preAuctionSlot)

    const ammBidTx: AMMBid = {
      TransactionType: 'AMMBid',
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
    }

    await testTransaction(testContext.client, ammBidTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { auction_slot, lp_token } = amm

    assert.ok(auction_slot)

    // @ts-expect-error: auction_slot should be defined at this point
    const afterPriceValue = parseFloat(auction_slot.price.value)
    // @ts-expect-error: preAuctionSlot should be defined at this point
    const beforePriceValue = parseFloat(preAuctionSlot.price.value)
    const diffPriceValue = 0.00268319257224121
    const expectedPriceValue = beforePriceValue + diffPriceValue

    const afterLPTokenValue = parseFloat(lp_token.value)
    const beforeLPTokenValue = parseFloat(preLPToken.value)
    const diffLPTokenValue = -0.0026831925721
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterPriceValue, expectedPriceValue)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('vote with AuthAccounts, BidMin, BidMax', async function () {
    const { asset, asset2, issuerWallet, testWallet } = ammPool

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { auction_slot: preAuctionSlot, lp_token: preLPToken } = preAmm

    assert.ok(preAuctionSlot)

    const ammBidTx: AMMBid = {
      TransactionType: 'AMMBid',
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      AuthAccounts: [
        {
          AuthAccount: {
            Account: issuerWallet.classicAddress,
          },
        },
      ],
      BidMin: { ...preLPToken, value: '5' },
      BidMax: { ...preLPToken, value: '10' },
    }

    await testTransaction(testContext.client, ammBidTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { auction_slot, lp_token } = amm

    assert.ok(auction_slot)

    // @ts-expect-error: auction_slot should be defined at this point
    const afterPriceValue = parseFloat(auction_slot.price.value)
    // @ts-expect-error: auction_slot should be defined at this point
    const beforePriceValue = parseFloat(preAuctionSlot.price.value)
    const diffPriceValue = 4.997316807427759
    const expectedPriceValue = beforePriceValue + diffPriceValue

    const afterLPTokenValue = parseFloat(lp_token.value)
    const beforeLPTokenValue = parseFloat(preLPToken.value)
    const diffLPTokenValue = -4.9974509670563
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterPriceValue, expectedPriceValue)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
    // @ts-expect-error: auction_slot should be defined at this point
    assert.deepEqual(auction_slot.auth_accounts, [
      {
        account: issuerWallet.classicAddress,
      },
    ])
  })
})
