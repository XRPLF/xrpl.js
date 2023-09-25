import { assert } from 'chai'
import { AMMBid, AMMDeposit, AMMDepositFlags } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('AMMBid', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('bid', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

    // Need to deposit (be an LP) before bidding is eligible
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { auction_slot: preAuctionSlot, lp_token: preLPToken } = preAmm
    if (preAuctionSlot === undefined) {
      throw new Error('preAuctionSlot should not be undefined')
    }

    const ammBidTx: AMMBid = {
      TransactionType: 'AMMBid',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
    }

    await testTransaction(testContext.client, ammBidTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { auction_slot, lp_token } = amm

    if (auction_slot === undefined) {
      throw new Error('auction_slot should not be undefined')
    }
    assert.equal(auction_slot.price.value > preAuctionSlot.price.value, true)
    assert.equal(lp_token.value < preLPToken.value, true)
  })

  it('vote with AuthAccounts, BidMin, BidMax', async function () {
    const { asset, asset2, issuerWallet } = testContext.amm
    const { wallet } = testContext

    // Need to deposit (be an LP) before bidding is eligible
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { auction_slot: preAuctionSlot, lp_token: preLPToken } = preAmm
    if (preAuctionSlot === undefined) {
      throw new Error('preAuctionSlot should not be undefined')
    }

    const ammBidTx: AMMBid = {
      TransactionType: 'AMMBid',
      Account: wallet.classicAddress,
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

    await testTransaction(testContext.client, ammBidTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
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
        account: issuerWallet.classicAddress,
      },
    ])
  })
})
